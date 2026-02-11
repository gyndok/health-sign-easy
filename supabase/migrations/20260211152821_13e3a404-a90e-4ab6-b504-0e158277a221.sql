
-- Create audit log table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for querying by user and time
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs (table_name);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only providers can read audit logs for their own actions or actions on their data
CREATE POLICY "Providers can read audit logs for their data"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert audit logs (via triggers running as security definer)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- No one can update or delete audit logs (immutable)
-- (No UPDATE/DELETE policies = denied by default)

-- Audit function for consent_submissions
CREATE OR REPLACE FUNCTION public.audit_consent_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, details)
    VALUES (
      NEW.provider_id,
      'consent_signed',
      'consent_submissions',
      NEW.id,
      jsonb_build_object(
        'patient_email', NEW.patient_email,
        'module_id', NEW.module_id,
        'invite_id', NEW.invite_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_consent_submission_trigger
  AFTER INSERT ON public.consent_submissions
  FOR EACH ROW EXECUTE FUNCTION public.audit_consent_submission();

-- Audit function for consent_withdrawals
CREATE OR REPLACE FUNCTION public.audit_consent_withdrawal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, details)
    VALUES (
      NEW.patient_user_id,
      'consent_withdrawn',
      'consent_withdrawals',
      NEW.id,
      jsonb_build_object('submission_id', NEW.submission_id, 'reason', NEW.reason)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_consent_withdrawal_trigger
  AFTER INSERT ON public.consent_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.audit_consent_withdrawal();

-- Audit function for invites
CREATE OR REPLACE FUNCTION public.audit_invite_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, details)
    VALUES (
      NEW.created_by,
      'invite_created',
      'invites',
      NEW.id,
      jsonb_build_object('patient_email', NEW.patient_email, 'module_id', NEW.module_id)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.audit_logs (user_id, action, table_name, record_id, details)
      VALUES (
        COALESCE(NEW.patient_user_id, NEW.created_by),
        'invite_status_changed',
        'invites',
        NEW.id,
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'patient_email', NEW.patient_email)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_invite_changes_trigger
  AFTER INSERT OR UPDATE ON public.invites
  FOR EACH ROW EXECUTE FUNCTION public.audit_invite_changes();

-- Audit function for consent_modules
CREATE OR REPLACE FUNCTION public.audit_module_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, details)
    VALUES (NEW.created_by, 'module_created', 'consent_modules', NEW.id, jsonb_build_object('name', NEW.name));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, details)
    VALUES (NEW.created_by, 'module_updated', 'consent_modules', NEW.id, jsonb_build_object('name', NEW.name));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, details)
    VALUES (OLD.created_by, 'module_deleted', 'consent_modules', OLD.id, jsonb_build_object('name', OLD.name));
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_module_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.consent_modules
  FOR EACH ROW EXECUTE FUNCTION public.audit_module_changes();
