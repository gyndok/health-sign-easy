-- Create consent_withdrawals table to track withdrawal requests
CREATE TABLE public.consent_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.consent_submissions(id) ON DELETE CASCADE,
  patient_user_id uuid NOT NULL,
  reason text,
  withdrawn_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(submission_id)
);

-- Enable RLS
ALTER TABLE public.consent_withdrawals ENABLE ROW LEVEL SECURITY;

-- Patients can insert their own withdrawals
CREATE POLICY "Patients can insert own withdrawals"
ON public.consent_withdrawals
FOR INSERT
WITH CHECK (auth.uid() = patient_user_id);

-- Patients can read their own withdrawals
CREATE POLICY "Patients can read own withdrawals"
ON public.consent_withdrawals
FOR SELECT
USING (auth.uid() = patient_user_id);

-- Providers can read withdrawals for their submissions
CREATE POLICY "Providers can read withdrawals for their submissions"
ON public.consent_withdrawals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM consent_submissions cs
    WHERE cs.id = consent_withdrawals.submission_id
    AND cs.provider_id = auth.uid()
  )
);

-- Add RLS policy for patients to read their own submissions
CREATE POLICY "Patients can read own submissions by invite"
ON public.consent_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM invites i
    WHERE i.id = consent_submissions.invite_id
    AND i.patient_user_id = auth.uid()
  )
);