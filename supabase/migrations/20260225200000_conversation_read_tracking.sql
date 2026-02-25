-- ============================================================
-- Conversation Read Tracking
-- Adds provider_last_read_at to invites so we can track which
-- patient messages the provider has already seen.
-- ============================================================

-- 1. Add column to invites
ALTER TABLE public.invites
  ADD COLUMN IF NOT EXISTS provider_last_read_at timestamptz;

-- 2. Mark conversation as read (provider calls this when viewing a chat)
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_invite_id uuid)
RETURNS void
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

  UPDATE invites
  SET provider_last_read_at = now()
  WHERE id = p_invite_id
    AND created_by = v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;

-- 3. Replace unread count RPC to only count messages AFTER provider_last_read_at
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
    AND (inv.provider_last_read_at IS NULL OR cm.created_at > inv.provider_last_read_at)
  GROUP BY cm.invite_id;
END;
$$;
