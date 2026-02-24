-- ============================================================
-- Onboarding fields for provider and patient profiles
-- ============================================================

-- 1a. Add new columns to provider_profiles
ALTER TABLE provider_profiles
  ADD COLUMN IF NOT EXISTS npi_number text,
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS license_state text,
  ADD COLUMN IF NOT EXISTS practice_address text,
  ADD COLUMN IF NOT EXISTS practice_city text,
  ADD COLUMN IF NOT EXISTS practice_state text,
  ADD COLUMN IF NOT EXISTS practice_zip text,
  ADD COLUMN IF NOT EXISTS default_consent_expiry_days integer DEFAULT 7,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- 1b. Add onboarding_completed_at to user_profiles (read by useAuth)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- 1c. Add onboarding_completed_at to patient_profiles
ALTER TABLE patient_profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- ============================================================
-- 1d. save_provider_onboarding RPC (SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION public.save_provider_onboarding(
  p_full_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_npi_number text DEFAULT NULL,
  p_license_number text DEFAULT NULL,
  p_license_state text DEFAULT NULL,
  p_primary_specialty text DEFAULT NULL,
  p_practice_name text DEFAULT NULL,
  p_practice_address text DEFAULT NULL,
  p_practice_city text DEFAULT NULL,
  p_practice_state text DEFAULT NULL,
  p_practice_zip text DEFAULT NULL,
  p_timezone text DEFAULT NULL,
  p_default_consent_expiry_days integer DEFAULT NULL,
  p_mark_complete boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Update provider_profiles (created by handle_new_user trigger)
  UPDATE provider_profiles SET
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(p_phone, phone),
    npi_number = COALESCE(p_npi_number, npi_number),
    license_number = COALESCE(p_license_number, license_number),
    license_state = COALESCE(p_license_state, license_state),
    primary_specialty = COALESCE(p_primary_specialty, primary_specialty),
    practice_name = COALESCE(p_practice_name, practice_name),
    practice_address = COALESCE(p_practice_address, practice_address),
    practice_city = COALESCE(p_practice_city, practice_city),
    practice_state = COALESCE(p_practice_state, practice_state),
    practice_zip = COALESCE(p_practice_zip, practice_zip),
    timezone = COALESCE(p_timezone, timezone),
    default_consent_expiry_days = COALESCE(p_default_consent_expiry_days, default_consent_expiry_days),
    onboarding_completed_at = CASE WHEN p_mark_complete THEN v_now ELSE onboarding_completed_at END,
    updated_at = v_now
  WHERE user_id = v_user_id;

  -- Also update user_profiles (for useAuth cache) — uses ::text cast for id comparison
  UPDATE user_profiles SET
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(p_phone, phone),
    primary_specialty = COALESCE(p_primary_specialty, primary_specialty),
    practice_name = COALESCE(p_practice_name, practice_name),
    timezone = COALESCE(p_timezone, timezone),
    onboarding_completed_at = CASE WHEN p_mark_complete THEN v_now ELSE onboarding_completed_at END,
    updated_at = v_now
  WHERE id = v_user_id::text;

  RETURN jsonb_build_object(
    'status', 'saved',
    'completed', p_mark_complete
  );
END;
$$;

-- ============================================================
-- 1e. save_patient_onboarding RPC (SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION public.save_patient_onboarding(
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_date_of_birth date DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_preferred_contact text DEFAULT 'email',
  p_email_consent_reminders boolean DEFAULT true,
  p_email_expiration_alerts boolean DEFAULT true,
  p_email_provider_updates boolean DEFAULT true,
  p_mark_complete boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_now timestamptz := now();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get email from auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  -- Upsert patient_profiles (handle_new_user does NOT create for patients)
  INSERT INTO patient_profiles (
    user_id, first_name, last_name, email, date_of_birth, phone, preferred_contact,
    onboarding_completed_at, created_at, updated_at
  ) VALUES (
    v_user_id,
    COALESCE(p_first_name, ''),
    COALESCE(p_last_name, ''),
    COALESCE(v_email, ''),
    COALESCE(p_date_of_birth, '1900-01-01'::date),
    p_phone,
    COALESCE(p_preferred_contact, 'email'),
    CASE WHEN p_mark_complete THEN v_now ELSE NULL END,
    v_now,
    v_now
  )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = COALESCE(NULLIF(p_first_name, ''), patient_profiles.first_name),
    last_name = COALESCE(NULLIF(p_last_name, ''), patient_profiles.last_name),
    date_of_birth = COALESCE(p_date_of_birth, patient_profiles.date_of_birth),
    phone = COALESCE(p_phone, patient_profiles.phone),
    preferred_contact = COALESCE(p_preferred_contact, patient_profiles.preferred_contact),
    onboarding_completed_at = CASE WHEN p_mark_complete THEN v_now ELSE patient_profiles.onboarding_completed_at END,
    updated_at = v_now;

  -- Upsert patient_notification_preferences
  INSERT INTO patient_notification_preferences (
    user_id, email_consent_reminders, email_expiration_alerts, email_provider_updates,
    created_at, updated_at
  ) VALUES (
    v_user_id,
    COALESCE(p_email_consent_reminders, true),
    COALESCE(p_email_expiration_alerts, true),
    COALESCE(p_email_provider_updates, true),
    v_now,
    v_now
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email_consent_reminders = COALESCE(p_email_consent_reminders, patient_notification_preferences.email_consent_reminders),
    email_expiration_alerts = COALESCE(p_email_expiration_alerts, patient_notification_preferences.email_expiration_alerts),
    email_provider_updates = COALESCE(p_email_provider_updates, patient_notification_preferences.email_provider_updates),
    updated_at = v_now;

  -- Update user_profiles onboarding status — uses ::text cast for id comparison
  UPDATE user_profiles SET
    full_name = COALESCE(
      CASE WHEN p_first_name IS NOT NULL AND p_last_name IS NOT NULL
        THEN p_first_name || ' ' || p_last_name
        ELSE NULL
      END,
      full_name
    ),
    phone = COALESCE(p_phone, phone),
    onboarding_completed_at = CASE WHEN p_mark_complete THEN v_now ELSE onboarding_completed_at END,
    updated_at = v_now
  WHERE id = v_user_id::text;

  RETURN jsonb_build_object(
    'status', 'saved',
    'completed', p_mark_complete
  );
END;
$$;

-- ============================================================
-- 1f. Update update_provider_profile RPC with new fields
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_provider_profile(
  p_full_name text,
  p_practice_name text DEFAULT NULL,
  p_primary_specialty text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_timezone text DEFAULT 'America/Chicago',
  p_npi_number text DEFAULT NULL,
  p_license_number text DEFAULT NULL,
  p_license_state text DEFAULT NULL,
  p_practice_address text DEFAULT NULL,
  p_practice_city text DEFAULT NULL,
  p_practice_state text DEFAULT NULL,
  p_practice_zip text DEFAULT NULL,
  p_default_consent_expiry_days integer DEFAULT 7
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Update user_profiles (for useAuth cache)
  UPDATE user_profiles SET
    full_name = p_full_name,
    practice_name = p_practice_name,
    primary_specialty = p_primary_specialty,
    phone = p_phone,
    timezone = COALESCE(p_timezone, 'America/Chicago'),
    updated_at = now()
  WHERE id = v_user_id::text;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Fallback: try casting both sides
  IF v_count = 0 THEN
    UPDATE user_profiles SET
      full_name = p_full_name,
      practice_name = p_practice_name,
      primary_specialty = p_primary_specialty,
      phone = p_phone,
      timezone = COALESCE(p_timezone, 'America/Chicago'),
      updated_at = now()
    WHERE id::text = v_user_id::text;

    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  -- Update provider_profiles with all fields
  UPDATE provider_profiles SET
    full_name = p_full_name,
    practice_name = p_practice_name,
    primary_specialty = p_primary_specialty,
    phone = p_phone,
    timezone = COALESCE(p_timezone, 'America/Chicago'),
    npi_number = p_npi_number,
    license_number = p_license_number,
    license_state = p_license_state,
    practice_address = p_practice_address,
    practice_city = p_practice_city,
    practice_state = p_practice_state,
    practice_zip = p_practice_zip,
    default_consent_expiry_days = COALESCE(p_default_consent_expiry_days, 7),
    updated_at = now()
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'status', CASE WHEN v_count > 0 THEN 'updated' ELSE 'not_found' END,
    'rows_updated', v_count
  );
END;
$$;
