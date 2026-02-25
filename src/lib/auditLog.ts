import { supabase } from "@/integrations/supabase/client";

/**
 * Log an audit event. This function never throws — audit logging
 * should never break the user experience.
 */
export async function logAuditEvent(
  action: string,
  resourceType: string,
  resourceId: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.rpc("log_audit_event" as any, {
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_details: details ? JSON.stringify(details) : null,
    });
  } catch {
    // Silently ignore — audit logging should never block the UI
  }
}
