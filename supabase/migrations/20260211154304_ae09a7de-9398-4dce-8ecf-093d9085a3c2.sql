
-- Add reminder tracking column to invites
ALTER TABLE public.invites
ADD COLUMN reminder_sent_at timestamp with time zone DEFAULT NULL;

-- Enable pg_cron and pg_net for scheduled functions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
