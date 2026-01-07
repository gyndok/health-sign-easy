-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('provider', 'patient');

-- Create enum for invitation status
CREATE TYPE public.invite_status AS ENUM ('pending', 'viewed', 'completed', 'expired');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create provider_profiles table
CREATE TABLE public.provider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  practice_name TEXT,
  primary_specialty TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'America/Chicago',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;

-- Providers can read and update their own profile
CREATE POLICY "Providers can read own profile"
  ON public.provider_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can update own profile"
  ON public.provider_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can insert own profile"
  ON public.provider_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create consent_modules table
CREATE TABLE public.consent_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.consent_modules ENABLE ROW LEVEL SECURITY;

-- Providers can CRUD their own modules
CREATE POLICY "Providers can read own modules"
  ON public.consent_modules
  FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Providers can insert own modules"
  ON public.consent_modules
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Providers can update own modules"
  ON public.consent_modules
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Providers can delete own modules"
  ON public.consent_modules
  FOR DELETE
  USING (auth.uid() = created_by);

-- Create invites table
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES public.consent_modules(id) ON DELETE CASCADE NOT NULL,
  patient_first_name TEXT NOT NULL,
  patient_last_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_phone TEXT,
  status invite_status NOT NULL DEFAULT 'pending',
  custom_message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  viewed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Providers can CRUD their own invites
CREATE POLICY "Providers can read own invites"
  ON public.invites
  FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Providers can insert own invites"
  ON public.invites
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Providers can update own invites"
  ON public.invites
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Providers can delete own invites"
  ON public.invites
  FOR DELETE
  USING (auth.uid() = created_by);

-- Public can read invites by token (for consent signing)
CREATE POLICY "Public can read invites by token"
  ON public.invites
  FOR SELECT
  USING (true);

-- Public can update invite status (for marking as viewed/completed)
CREATE POLICY "Public can update invite status"
  ON public.invites
  FOR UPDATE
  USING (true);

-- Create consent_submissions table
CREATE TABLE public.consent_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID REFERENCES public.invites(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES public.consent_modules(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  patient_first_name TEXT NOT NULL,
  patient_last_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  signature TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.consent_submissions ENABLE ROW LEVEL SECURITY;

-- Providers can read submissions for their invites
CREATE POLICY "Providers can read own submissions"
  ON public.consent_submissions
  FOR SELECT
  USING (auth.uid() = provider_id);

-- Public can insert submissions (for consent signing)
CREATE POLICY "Public can insert submissions"
  ON public.consent_submissions
  FOR INSERT
  WITH CHECK (true);

-- Public can read modules by invite token (for consent signing page)
CREATE POLICY "Public can read modules for signing"
  ON public.consent_modules
  FOR SELECT
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_provider_profiles_updated_at
  BEFORE UPDATE ON public.provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consent_modules_updated_at
  BEFORE UPDATE ON public.consent_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();