-- Add a PERMISSIVE policy for providers to read withdrawals for their submissions
-- This works better with nested selects in the Supabase client
CREATE POLICY "Providers can read withdrawals via submission join"
ON public.consent_withdrawals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM consent_submissions cs
    WHERE cs.id = consent_withdrawals.submission_id
    AND cs.provider_id = auth.uid()
  )
);

-- Change the existing policy to PERMISSIVE if needed (drop and recreate)
DROP POLICY IF EXISTS "Providers can read withdrawals for their submissions" ON public.consent_withdrawals;