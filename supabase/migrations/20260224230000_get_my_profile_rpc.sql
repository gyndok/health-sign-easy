-- ============================================================
-- SECURITY DEFINER RPC to fetch current user's profile + org
-- Bypasses the recursive RLS policy (42P17) on user_profiles
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile jsonb;
  v_org jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('profile', null, 'organization', null);
  END IF;

  -- Fetch user_profiles (bypasses RLS via SECURITY DEFINER)
  SELECT to_jsonb(up.*) INTO v_profile
  FROM user_profiles up
  WHERE up.id = v_user_id;

  -- Fetch organization if profile has org_id
  IF v_profile IS NOT NULL AND v_profile->>'org_id' IS NOT NULL THEN
    SELECT to_jsonb(o.*) INTO v_org
    FROM organizations o
    WHERE o.id = (v_profile->>'org_id')::uuid;
  END IF;

  RETURN jsonb_build_object(
    'profile', v_profile,
    'organization', v_org
  );
END;
$$;
