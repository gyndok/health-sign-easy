-- Create patient_profiles table for patients who create accounts
CREATE TABLE public.patient_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  date_of_birth date NOT NULL,
  phone text,
  preferred_contact text DEFAULT 'email' CHECK (preferred_contact IN ('email', 'phone', 'text')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on patient_profiles
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

-- Patients can read their own profile
CREATE POLICY "Patients can read own profile"
ON public.patient_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Patients can insert their own profile
CREATE POLICY "Patients can insert own profile"
ON public.patient_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Patients can update their own profile
CREATE POLICY "Patients can update own profile"
ON public.patient_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Providers can read patient profiles for their submissions
CREATE POLICY "Providers can read patient profiles for their submissions"
ON public.patient_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.consent_submissions cs
    JOIN public.invites i ON cs.invite_id = i.id
    WHERE i.created_by = auth.uid()
    AND cs.patient_email = patient_profiles.email
  )
);

-- Add trigger for updated_at on patient_profiles
CREATE TRIGGER update_patient_profiles_updated_at
BEFORE UPDATE ON public.patient_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Make patient name fields nullable on invites (will be captured when patient completes)
ALTER TABLE public.invites 
  ALTER COLUMN patient_first_name DROP NOT NULL,
  ALTER COLUMN patient_last_name DROP NOT NULL;

-- Add patient_user_id to invites to track if patient created an account
ALTER TABLE public.invites
  ADD COLUMN patient_user_id uuid REFERENCES auth.users(id);

-- Update handle_new_user function to also handle patient profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from metadata, default to 'patient'
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient');
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  -- If provider, create provider profile
  IF user_role = 'provider' THEN
    INSERT INTO public.provider_profiles (user_id, full_name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Provider'),
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