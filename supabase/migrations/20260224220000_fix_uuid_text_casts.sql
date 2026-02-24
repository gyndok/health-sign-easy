-- ============================================================
-- Fix: user_profiles.id and org_id are UUID type, NOT text
-- Remove all ::text casts that broke INSERTs and UPDATEs
-- ============================================================

-- Fix handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role app_role;
  v_full_name text;
  v_org_id uuid;
BEGIN
  -- Get role from metadata, default to 'patient'
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User');

  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);

  -- Create a default organization for this user
  INSERT INTO public.organizations (name, slug)
  VALUES (
    v_full_name || '''s Practice',
    'org-' || substr(NEW.id::text, 1, 8)
  )
  RETURNING id INTO v_org_id;

  -- Create user_profiles row (id and org_id are UUID type)
  INSERT INTO public.user_profiles (id, full_name, role, org_id, email)
  VALUES (
    NEW.id,
    v_full_name,
    user_role::text,
    v_org_id,
    NEW.email
  );

  -- If provider, create provider profile
  IF user_role = 'provider' THEN
    INSERT INTO public.provider_profiles (user_id, full_name, email)
    VALUES (
      NEW.id,
      v_full_name,
      NEW.email
    );
  END IF;

  -- If patient and has metadata, create patient profile
  IF user_role = 'patient' AND NEW.raw_user_meta_data->>'first_name' IS NOT NULL THEN
    INSERT INTO public.patient_profiles (user_id, first_name, last_name, email, date_of_birth, phone, preferred_contact)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      NEW.email,
      (NEW.raw_user_meta_data->>'date_of_birth')::date,
      NEW.raw_user_meta_data->>'phone',
      COALESCE(NEW.raw_user_meta_data->>'preferred_contact', 'email')
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- Fix save_provider_onboarding: use uuid directly, no ::text
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
  v_email text;
  v_org_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get email from auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

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

  -- Check if user_profiles exists for this user
  SELECT org_id INTO v_org_id FROM user_profiles WHERE id = v_user_id;

  IF v_org_id IS NULL THEN
    -- No user_profiles row exists — create a default org and user_profiles row
    DECLARE
      v_new_org_id uuid;
    BEGIN
      INSERT INTO organizations (name, slug)
      VALUES (
        COALESCE(p_full_name, 'My Practice') || '''s Practice',
        'org-' || substr(v_user_id::text, 1, 8)
      )
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_new_org_id;

      -- If org already existed, find it
      IF v_new_org_id IS NULL THEN
        SELECT id INTO v_new_org_id FROM organizations WHERE slug = 'org-' || substr(v_user_id::text, 1, 8);
      END IF;

      INSERT INTO user_profiles (id, full_name, role, org_id, email, phone, practice_name, primary_specialty, timezone, onboarding_completed_at, updated_at)
      VALUES (
        v_user_id,
        COALESCE(p_full_name, 'New Provider'),
        'provider',
        v_new_org_id,
        v_email,
        p_phone,
        p_practice_name,
        p_primary_specialty,
        COALESCE(p_timezone, 'America/Chicago'),
        CASE WHEN p_mark_complete THEN v_now ELSE NULL END,
        v_now
      )
      ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(p_full_name, user_profiles.full_name),
        phone = COALESCE(p_phone, user_profiles.phone),
        practice_name = COALESCE(p_practice_name, user_profiles.practice_name),
        primary_specialty = COALESCE(p_primary_specialty, user_profiles.primary_specialty),
        timezone = COALESCE(p_timezone, user_profiles.timezone),
        onboarding_completed_at = CASE WHEN p_mark_complete THEN v_now ELSE user_profiles.onboarding_completed_at END,
        updated_at = v_now;
    END;
  ELSE
    -- user_profiles row exists, just update it
    UPDATE user_profiles SET
      full_name = COALESCE(p_full_name, full_name),
      phone = COALESCE(p_phone, phone),
      primary_specialty = COALESCE(p_primary_specialty, primary_specialty),
      practice_name = COALESCE(p_practice_name, practice_name),
      timezone = COALESCE(p_timezone, timezone),
      onboarding_completed_at = CASE WHEN p_mark_complete THEN v_now ELSE onboarding_completed_at END,
      updated_at = v_now
    WHERE id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'status', 'saved',
    'completed', p_mark_complete
  );
END;
$$;

-- ============================================================
-- Fix save_patient_onboarding: use uuid directly, no ::text
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
  v_full_name text;
  v_org_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get email from auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  v_full_name := COALESCE(
    CASE WHEN p_first_name IS NOT NULL AND p_last_name IS NOT NULL
      THEN p_first_name || ' ' || p_last_name
      ELSE NULL
    END,
    'Patient'
  );

  -- Upsert patient_profiles
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

  -- Ensure user_profiles row exists for patient
  SELECT org_id INTO v_org_id FROM user_profiles WHERE id = v_user_id;

  IF v_org_id IS NULL THEN
    -- No user_profiles row — create one
    DECLARE
      v_new_org_id uuid;
    BEGIN
      INSERT INTO organizations (name, slug)
      VALUES (v_full_name || '''s Account', 'org-' || substr(v_user_id::text, 1, 8))
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_new_org_id;

      IF v_new_org_id IS NULL THEN
        SELECT id INTO v_new_org_id FROM organizations WHERE slug = 'org-' || substr(v_user_id::text, 1, 8);
      END IF;

      INSERT INTO user_profiles (id, full_name, role, org_id, email, phone, onboarding_completed_at, updated_at)
      VALUES (
        v_user_id,
        v_full_name,
        'patient',
        v_new_org_id,
        v_email,
        p_phone,
        CASE WHEN p_mark_complete THEN v_now ELSE NULL END,
        v_now
      )
      ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(v_full_name, user_profiles.full_name),
        phone = COALESCE(p_phone, user_profiles.phone),
        onboarding_completed_at = CASE WHEN p_mark_complete THEN v_now ELSE user_profiles.onboarding_completed_at END,
        updated_at = v_now;
    END;
  ELSE
    -- user_profiles exists, just update
    UPDATE user_profiles SET
      full_name = COALESCE(v_full_name, full_name),
      phone = COALESCE(p_phone, phone),
      onboarding_completed_at = CASE WHEN p_mark_complete THEN v_now ELSE onboarding_completed_at END,
      updated_at = v_now
    WHERE id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'status', 'saved',
    'completed', p_mark_complete
  );
END;
$$;

-- ============================================================
-- Fix update_provider_profile: use uuid directly, no ::text
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

  -- Update user_profiles (id is uuid, match directly)
  UPDATE user_profiles SET
    full_name = p_full_name,
    practice_name = p_practice_name,
    primary_specialty = p_primary_specialty,
    phone = p_phone,
    timezone = COALESCE(p_timezone, 'America/Chicago'),
    updated_at = now()
  WHERE id = v_user_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;

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
