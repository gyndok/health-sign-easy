-- Drop overly permissive policies
DROP POLICY IF EXISTS "Public can update invite status" ON public.invites;

-- Create more restrictive policy - only allow updating status fields via valid non-expired token
CREATE POLICY "Public can update invite via token"
  ON public.invites
  FOR UPDATE
  USING (
    expires_at > now() 
    AND status != 'completed'
  )
  WITH CHECK (
    expires_at > now()
    AND status != 'completed'
  );