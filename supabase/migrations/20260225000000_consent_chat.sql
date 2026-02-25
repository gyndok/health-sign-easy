-- ============================================================
-- Consent Chat: table, indexes, RLS, RPCs, Realtime
-- ============================================================

-- 1. consent_messages table
CREATE TABLE IF NOT EXISTS public.consent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES public.invites(id) ON DELETE CASCADE,
  sender_id uuid,  -- null for guest patients
  sender_role text NOT NULL CHECK (sender_role IN ('patient', 'provider')),
  sender_name text NOT NULL,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_consent_messages_invite_id ON public.consent_messages(invite_id);
CREATE INDEX idx_consent_messages_invite_created ON public.consent_messages(invite_id, created_at);

-- Enable RLS
ALTER TABLE public.consent_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies (SELECT only — all writes go through SECURITY DEFINER RPCs)
CREATE POLICY "Providers can read messages for own invites"
ON public.consent_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invites
    WHERE invites.id = consent_messages.invite_id
    AND invites.created_by = auth.uid()
  )
);

CREATE POLICY "Patients can read messages for own invites"
ON public.consent_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invites
    WHERE invites.id = consent_messages.invite_id
    AND invites.patient_user_id::text = auth.uid()::text
  )
);

-- ============================================================
-- 2. Patient invite access policy (for patient dashboard)
-- ============================================================
-- Drop first in case it already exists
DROP POLICY IF EXISTS "Patients can read own invites" ON public.invites;
CREATE POLICY "Patients can read own invites"
ON public.invites FOR SELECT
USING (auth.uid()::text = patient_user_id::text);

-- ============================================================
-- 3. SECURITY DEFINER RPCs
-- ============================================================

-- 3a. Send message as patient (by invite token — works for guest and authenticated)
CREATE OR REPLACE FUNCTION public.send_consent_message_by_token(
  p_token uuid,
  p_message text,
  p_sender_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_id uuid;
  v_sender_id uuid;
  v_msg_id uuid;
BEGIN
  -- Validate token and get invite
  SELECT id INTO v_invite_id
  FROM invites
  WHERE token = p_token
    AND status IN ('pending', 'viewed', 'completed')
    AND expires_at > now();

  IF v_invite_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;

  -- Get auth user id if authenticated (null for anonymous/guest)
  v_sender_id := auth.uid();

  -- Validate message
  IF p_message IS NULL OR char_length(trim(p_message)) = 0 THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;
  IF char_length(p_message) > 2000 THEN
    RAISE EXCEPTION 'Message too long (max 2000 characters)';
  END IF;

  -- Insert message
  INSERT INTO consent_messages (invite_id, sender_id, sender_role, sender_name, message)
  VALUES (v_invite_id, v_sender_id, 'patient', trim(p_sender_name), trim(p_message))
  RETURNING id INTO v_msg_id;

  RETURN jsonb_build_object('id', v_msg_id, 'status', 'sent');
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_consent_message_by_token(uuid, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.send_consent_message_by_token(uuid, text, text) TO authenticated;

-- 3b. Send message as provider (authenticated, validates ownership)
CREATE OR REPLACE FUNCTION public.send_consent_message_as_provider(
  p_invite_id uuid,
  p_message text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_provider_name text;
  v_msg_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate provider owns this invite
  IF NOT EXISTS (
    SELECT 1 FROM invites WHERE id = p_invite_id AND created_by = v_user_id
  ) THEN
    RAISE EXCEPTION 'Invite not found or not owned by you';
  END IF;

  -- Get provider name
  SELECT full_name INTO v_provider_name
  FROM provider_profiles
  WHERE user_id = v_user_id;

  v_provider_name := COALESCE(v_provider_name, 'Provider');

  -- Validate message
  IF p_message IS NULL OR char_length(trim(p_message)) = 0 THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;
  IF char_length(p_message) > 2000 THEN
    RAISE EXCEPTION 'Message too long (max 2000 characters)';
  END IF;

  -- Insert message
  INSERT INTO consent_messages (invite_id, sender_id, sender_role, sender_name, message)
  VALUES (p_invite_id, v_user_id, 'provider', v_provider_name, trim(p_message))
  RETURNING id INTO v_msg_id;

  RETURN jsonb_build_object('id', v_msg_id, 'status', 'sent');
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_consent_message_as_provider(uuid, text) TO authenticated;

-- 3c. Get messages by invite token (for patients)
CREATE OR REPLACE FUNCTION public.get_consent_messages_by_token(
  p_token uuid
)
RETURNS TABLE (
  id uuid,
  invite_id uuid,
  sender_role text,
  sender_name text,
  message text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_id uuid;
BEGIN
  -- Validate token
  SELECT inv.id INTO v_invite_id
  FROM invites inv
  WHERE inv.token = p_token;

  IF v_invite_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite token';
  END IF;

  RETURN QUERY
  SELECT cm.id, cm.invite_id, cm.sender_role, cm.sender_name, cm.message, cm.created_at
  FROM consent_messages cm
  WHERE cm.invite_id = v_invite_id
  ORDER BY cm.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_consent_messages_by_token(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_consent_messages_by_token(uuid) TO authenticated;

-- 3d. Get unread message counts for provider's invites
CREATE OR REPLACE FUNCTION public.get_invite_unread_message_counts()
RETURNS TABLE (
  invite_id uuid,
  patient_message_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT cm.invite_id, COUNT(*)::bigint AS patient_message_count
  FROM consent_messages cm
  INNER JOIN invites inv ON inv.id = cm.invite_id
  WHERE inv.created_by = v_user_id
    AND cm.sender_role = 'patient'
  GROUP BY cm.invite_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_unread_message_counts() TO authenticated;

-- ============================================================
-- 4. Enable Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.consent_messages;
