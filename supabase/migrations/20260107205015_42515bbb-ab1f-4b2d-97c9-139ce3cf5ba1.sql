-- Public consent signing RPCs (token-based)

CREATE OR REPLACE FUNCTION public.get_invite_by_token(p_token uuid)
RETURNS TABLE (
  id uuid,
  token uuid,
  patient_email text,
  patient_first_name text,
  patient_last_name text,
  custom_message text,
  status public.invite_status,
  expires_at timestamptz,
  module_id uuid,
  module_name text,
  module_description text,
  module_video_url text,
  provider_full_name text,
  provider_practice_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id,
    i.token,
    i.patient_email,
    i.patient_first_name,
    i.patient_last_name,
    i.custom_message,
    i.status,
    i.expires_at,
    cm.id AS module_id,
    cm.name AS module_name,
    cm.description AS module_description,
    cm.video_url AS module_video_url,
    pp.full_name AS provider_full_name,
    pp.practice_name AS provider_practice_name
  FROM public.invites i
  JOIN public.consent_modules cm ON cm.id = i.module_id
  LEFT JOIN public.provider_profiles pp ON pp.user_id = i.created_by
  WHERE i.token = p_token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.mark_invite_viewed(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  UPDATE public.invites
  SET status = 'viewed',
      viewed_at = COALESCE(viewed_at, now())
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_invite_patient_info_by_token(
  p_token uuid,
  p_first_name text,
  p_last_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  UPDATE public.invites
  SET patient_first_name = NULLIF(BTRIM(p_first_name), ''),
      patient_last_name  = NULLIF(BTRIM(p_last_name), '')
  WHERE token = p_token
    AND status IN ('pending','viewed')
    AND expires_at > now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.link_invite_patient_user_by_token(
  p_token uuid,
  p_first_name text,
  p_last_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_count integer := 0;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  UPDATE public.invites
  SET patient_user_id = v_uid,
      patient_first_name = COALESCE(patient_first_name, NULLIF(BTRIM(p_first_name), '')),
      patient_last_name  = COALESCE(patient_last_name,  NULLIF(BTRIM(p_last_name),  ''))
  WHERE token = p_token
    AND status IN ('pending','viewed')
    AND expires_at > now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_consent_by_token(
  p_token uuid,
  p_patient_first_name text,
  p_patient_last_name text,
  p_signature text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite record;
  v_submission_id uuid;
BEGIN
  SELECT i.*
  INTO v_invite
  FROM public.invites i
  WHERE i.token = p_token
    AND i.status IN ('pending','viewed')
    AND i.expires_at > now()
  FOR UPDATE;

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'invalid_or_expired';
  END IF;

  -- Ensure patient name is saved on the invite (best-effort)
  UPDATE public.invites
  SET patient_first_name = COALESCE(patient_first_name, NULLIF(BTRIM(p_patient_first_name), '')),
      patient_last_name  = COALESCE(patient_last_name,  NULLIF(BTRIM(p_patient_last_name),  ''))
  WHERE id = v_invite.id;

  INSERT INTO public.consent_submissions (
    invite_id,
    module_id,
    provider_id,
    patient_email,
    patient_first_name,
    patient_last_name,
    signature,
    signed_at
  ) VALUES (
    v_invite.id,
    v_invite.module_id,
    v_invite.created_by,
    v_invite.patient_email,
    COALESCE(NULLIF(BTRIM(p_patient_first_name), ''), COALESCE(v_invite.patient_first_name, '')),
    COALESCE(NULLIF(BTRIM(p_patient_last_name),  ''), COALESCE(v_invite.patient_last_name,  '')),
    NULLIF(BTRIM(p_signature), ''),
    now()
  )
  RETURNING id INTO v_submission_id;

  UPDATE public.invites
  SET status = 'completed',
      completed_at = now()
  WHERE id = v_invite.id;

  RETURN v_submission_id;
END;
$$;

-- Lock down execute privileges explicitly
REVOKE ALL ON FUNCTION public.get_invite_by_token(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_invite_viewed(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_invite_patient_info_by_token(uuid,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.link_invite_patient_user_by_token(uuid,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_consent_by_token(uuid,text,text,text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_invite_by_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_invite_viewed(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_invite_patient_info_by_token(uuid,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_invite_patient_user_by_token(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_consent_by_token(uuid,text,text,text) TO anon, authenticated;
