import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const PUBLIC_APP_URL = (Deno.env.get("PUBLIC_APP_URL") || "").replace(/\/$/, "");

    const resend = new Resend(RESEND_API_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find invites expiring within 48 hours that haven't had a reminder sent
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const { data: expiringInvites, error: fetchError } = await supabase
      .from("invites")
      .select(`
        id,
        token,
        patient_email,
        patient_first_name,
        expires_at,
        reminder_sent_at,
        module_id,
        created_by,
        consent_modules!inner (name)
      `)
      .in("status", ["pending", "viewed"])
      .is("reminder_sent_at", null)
      .gt("expires_at", now.toISOString())
      .lte("expires_at", in48Hours.toISOString());

    if (fetchError) {
      console.error("Error fetching expiring invites:", fetchError);
      throw new Error(`Failed to fetch expiring invites: ${fetchError.message}`);
    }

    if (!expiringInvites || expiringInvites.length === 0) {
      console.log("No expiring invites found that need reminders");
      return new Response(
        JSON.stringify({ success: true, reminders_sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${expiringInvites.length} expiring invites to remind`);

    let remindersSent = 0;
    const errors: string[] = [];

    for (const invite of expiringInvites) {
      try {
        const module = (invite as any).consent_modules;
        const moduleName = module?.name || "Consent Form";

        // Fetch provider info separately since there's no direct FK
        const { data: providerData } = await supabase
          .from("provider_profiles")
          .select("full_name, practice_name")
          .eq("user_id", invite.created_by)
          .maybeSingle();

        const providerName = providerData?.full_name || "Your Healthcare Provider";
        const practiceName = providerData?.practice_name || "";
        const patientName = invite.patient_first_name || "";
        const expiresAt = new Date(invite.expires_at);
        const hoursLeft = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));

        const consentLink = PUBLIC_APP_URL
          ? `${PUBLIC_APP_URL}/consent/${invite.token}`
          : null;

        if (!consentLink) {
          console.warn(`Skipping invite ${invite.id}: no PUBLIC_APP_URL configured`);
          continue;
        }

        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Consent Reminder</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Reminder</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your consent form is expiring soon</p>
              </div>
              
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                <h2 style="color: #111827; margin: 0 0 20px 0;">Hello${patientName ? ` ${patientName}` : ""},</h2>
                
                <p style="margin: 0 0 15px 0;">
                  This is a friendly reminder that your consent form from <strong>${providerName}</strong>${practiceName ? ` at <strong>${practiceName}</strong>` : ""} will expire in approximately <strong>${hoursLeft} hours</strong>.
                </p>
                
                <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <strong style="color: #92400e;">${moduleName}</strong>
                  <br>
                  <span style="font-size: 14px; color: #a16207;">Expires: ${expiresAt.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                </div>
                
                <p style="margin: 20px 0;">
                  Please review and sign the consent form before it expires:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${consentLink}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Review & Sign Now
                  </a>
                </div>
                
                <p style="margin: 20px 0 0 0; font-size: 14px; color: #6b7280;">
                  If you've already signed this form, please disregard this email. If you have questions, contact your healthcare provider directly.
                </p>
              </div>
              
              <div style="background: #f9fafb; padding: 20px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                  This reminder was sent by ClearConsent on behalf of ${practiceName || providerName}.
                  <br>
                  If you did not expect this email, you can safely ignore it.
                </p>
              </div>
            </body>
          </html>
        `;

        const emailResponse = await resend.emails.send({
          from: "ClearConsent <noreply@santelishealth.com>",
          to: [invite.patient_email],
          subject: `⏰ Reminder: Consent form expiring soon — ${moduleName}`,
          html: emailHtml,
        });

        console.log(`Reminder sent to ${invite.patient_email}:`, emailResponse);

        // Mark reminder as sent
        await supabase
          .from("invites")
          .update({ reminder_sent_at: now.toISOString() })
          .eq("id", invite.id);

        remindersSent++;
      } catch (emailError) {
        const msg = emailError instanceof Error ? emailError.message : "Unknown error";
        console.error(`Failed to send reminder for invite ${invite.id}:`, msg);
        errors.push(`${invite.id}: ${msg}`);
      }
    }

    console.log(`Reminders sent: ${remindersSent}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: remindersSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-expiration-reminders:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
