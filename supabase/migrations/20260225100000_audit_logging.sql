-- ============================================================
-- Audit Logging RPCs + Policies
-- ============================================================
-- The audit_log table already exists. This migration adds:
-- 1. SECURITY DEFINER RPC to insert audit entries (auto-captures user + org)
-- 2. RLS policies for immutable audit trail
-- 3. SECURITY DEFINER RPC to query audit log (for audit viewer page)

-- ============================================================
-- 1. log_audit_event() — SECURITY DEFINER insert RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Look up the org_id for the current user (may be null for anon/patient)
  SELECT org_id INTO v_org_id
  FROM user_profiles
  WHERE id = auth.uid();

  INSERT INTO audit_log (action, resource_type, resource_id, details, actor_id, org_id)
  VALUES (
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    auth.uid(),
    v_org_id
  );
END;
$$;

-- ============================================================
-- 2. Make audit_log immutable — no UPDATE or DELETE allowed
-- ============================================================
-- Enable RLS if not already
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Providers can view own org audit logs" ON audit_log;
DROP POLICY IF EXISTS "No one can update audit logs" ON audit_log;
DROP POLICY IF EXISTS "No one can delete audit logs" ON audit_log;

-- Providers can read their org's audit entries
CREATE POLICY "Providers can view own org audit logs"
  ON audit_log FOR SELECT
  USING (
    org_id = (SELECT up.org_id FROM user_profiles up WHERE up.id = auth.uid())
  );

-- Block UPDATE for everyone (immutable log)
CREATE POLICY "No one can update audit logs"
  ON audit_log FOR UPDATE
  USING (false);

-- Block DELETE for everyone (immutable log)
CREATE POLICY "No one can delete audit logs"
  ON audit_log FOR DELETE
  USING (false);

-- ============================================================
-- 3. get_audit_log_entries() — SECURITY DEFINER read RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_audit_log_entries(
  p_limit int DEFAULT 25,
  p_offset int DEFAULT 0,
  p_action_filter text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_days int DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  action text,
  resource_type text,
  resource_id text,
  details jsonb,
  actor_id uuid,
  org_id uuid,
  created_at timestamptz,
  actor_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Get caller's org
  SELECT up.org_id INTO v_org_id
  FROM user_profiles up
  WHERE up.id = auth.uid();

  IF v_org_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    al.id,
    al.action,
    al.resource_type,
    al.resource_id,
    al.details,
    al.actor_id,
    al.org_id,
    al.created_at,
    u.email AS actor_email
  FROM audit_log al
  LEFT JOIN auth.users u ON u.id = al.actor_id
  WHERE al.org_id = v_org_id
    AND (p_action_filter IS NULL OR al.action = p_action_filter)
    AND (p_search IS NULL OR
         al.action ILIKE '%' || p_search || '%' OR
         al.resource_type ILIKE '%' || p_search || '%' OR
         al.resource_id ILIKE '%' || p_search || '%')
    AND (p_days IS NULL OR al.created_at >= NOW() - (p_days || ' days')::interval)
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
