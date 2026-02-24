-- Fix: Cast auth.uid() to text for comparison with user_profiles.id
-- The user_profiles table may use text type for id, while auth.uid() returns uuid.

CREATE OR REPLACE FUNCTION public.update_provider_profile(
  p_full_name text,
  p_practice_name text DEFAULT NULL,
  p_primary_specialty text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_timezone text DEFAULT 'America/Chicago'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_count int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Try matching id as both uuid and text to handle either column type
  UPDATE user_profiles
  SET
    full_name = p_full_name,
    practice_name = p_practice_name,
    primary_specialty = p_primary_specialty,
    phone = p_phone,
    timezone = p_timezone,
    updated_at = now()
  WHERE id = v_user_id::text;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count = 0 THEN
    -- Fallback: try uuid comparison in case id column is uuid type
    UPDATE user_profiles
    SET
      full_name = p_full_name,
      practice_name = p_practice_name,
      primary_specialty = p_primary_specialty,
      phone = p_phone,
      timezone = p_timezone,
      updated_at = now()
    WHERE id::text = v_user_id::text;

    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'status', CASE WHEN v_count > 0 THEN 'updated' ELSE 'not_found' END,
    'rows_updated', v_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_provider_profile(text, text, text, text, text) TO authenticated;
