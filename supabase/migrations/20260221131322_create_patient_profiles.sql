-- Create patient_profiles table (for patient-specific fields)
CREATE TABLE IF NOT EXISTS patient_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  date_of_birth date NOT NULL,
  phone text,
  preferred_contact text DEFAULT 'email' CHECK (preferred_contact IN ('email', 'phone', 'text')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;

-- Patients can read their own profile
CREATE POLICY "Patients can read own profile"
ON patient_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Patients can insert their own profile
CREATE POLICY "Patients can insert own profile"
ON patient_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Patients can update their own profile
CREATE POLICY "Patients can update own profile"
ON patient_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Providers can read patient profiles for their submissions (via consent_submissions)
CREATE POLICY "Providers can read patient profiles for their submissions"
ON patient_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM consent_submissions cs
    JOIN invites i ON cs.invite_id = i.id
    WHERE i.created_by = auth.uid()
    AND cs.patient_email = patient_profiles.email
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_patient_profiles_updated_at
BEFORE UPDATE ON patient_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
