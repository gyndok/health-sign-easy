-- Create patient notification preferences table
CREATE TABLE public.patient_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_consent_reminders BOOLEAN NOT NULL DEFAULT true,
  email_expiration_alerts BOOLEAN NOT NULL DEFAULT true,
  email_provider_updates BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Patients can read own preferences"
ON public.patient_notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Patients can insert own preferences"
ON public.patient_notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Patients can update own preferences"
ON public.patient_notification_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_patient_notification_preferences_updated_at
BEFORE UPDATE ON public.patient_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();