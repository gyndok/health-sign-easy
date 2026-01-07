-- Drop overly permissive submissions insert policy
DROP POLICY IF EXISTS "Public can insert submissions" ON public.consent_submissions;

-- Create more restrictive policy - only allow inserting for valid, non-expired, non-completed invites
CREATE POLICY "Public can insert submissions for valid invites"
  ON public.consent_submissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invites
      WHERE invites.id = consent_submissions.invite_id
        AND invites.expires_at > now()
        AND invites.status != 'completed'
    )
  );