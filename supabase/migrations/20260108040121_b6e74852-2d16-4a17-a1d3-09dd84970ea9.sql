-- Drop the overly permissive public read policy that exposes all invites
DROP POLICY IF EXISTS "Public can read invites by token" ON public.invites;