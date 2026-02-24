-- Debug version: wrap handle_new_user in exception handler to capture actual error
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role app_role;
  v_full_name text;
  v_org_id uuid;
  v_step text := 'init';
BEGIN
  v_step := 'parse_role';
  -- Get role from metadata, default to 'patient'
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User');

  v_step := 'insert_user_roles';
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);

  v_step := 'insert_organization';
  -- Create a default organization for this user
  BEGIN
    INSERT INTO public.organizations (name, slug)
    VALUES (
      v_full_name || '''s Practice',
      'org-' || substr(NEW.id::text, 1, 8)
    )
    RETURNING id INTO v_org_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'STEP=% ERROR=% DETAIL=% (name=%, slug=%)',
      v_step, SQLERRM, SQLSTATE,
      v_full_name || '''s Practice',
      'org-' || substr(NEW.id::text, 1, 8);
  END;

  v_step := 'insert_user_profiles';
  -- Create user_profiles row (used by useAuth for role/profile data)
  BEGIN
    INSERT INTO public.user_profiles (id, full_name, role, org_id, email)
    VALUES (
      NEW.id::text,
      v_full_name,
      user_role::text,
      v_org_id::text,
      NEW.email
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'STEP=% ERROR=% DETAIL=% (id=%, org_id=%)',
      v_step, SQLERRM, SQLSTATE,
      NEW.id::text,
      v_org_id::text;
  END;

  v_step := 'insert_provider_profile';
  -- If provider, create provider profile
  IF user_role = 'provider' THEN
    BEGIN
      INSERT INTO public.provider_profiles (user_id, full_name, email)
      VALUES (
        NEW.id,
        v_full_name,
        NEW.email
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'STEP=% ERROR=% DETAIL=%',
        v_step, SQLERRM, SQLSTATE;
    END;
  END IF;

  v_step := 'insert_patient_profile';
  -- If patient and has metadata, create patient profile
  IF user_role = 'patient' AND NEW.raw_user_meta_data->>'first_name' IS NOT NULL THEN
    BEGIN
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
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'STEP=% ERROR=% DETAIL=%',
        v_step, SQLERRM, SQLSTATE;
    END;
  END IF;

  RETURN NEW;
END;
$$;
