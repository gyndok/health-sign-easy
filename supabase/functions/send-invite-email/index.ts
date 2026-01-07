import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendInviteEmailRequest {
  inviteId: string;
  inviteToken?: string;
  patientEmail: string;
  moduleName: string;
  providerName: string;
  practiceName: string;
  customMessage?: string;
  consentLink?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      patientEmail,
      moduleName,
      providerName,
      practiceName,
      customMessage,
      consentLink,
      inviteToken,
    }: SendInviteEmailRequest = await req.json();

    console.log("Sending invitation email to:", patientEmail);

    const publicAppUrl = (Deno.env.get("PUBLIC_APP_URL") || "").replace(/\/$/, "");
    const resolvedConsentLink =
      publicAppUrl && inviteToken
        ? `${publicAppUrl}/consent/${inviteToken}`
        : consentLink;

    if (!resolvedConsentLink) {
      throw new Error(
        "Missing consent link. Provide consentLink or set PUBLIC_APP_URL and inviteToken."
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Consent Request</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">ClearConsent</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Digital Consent Management</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #111827; margin: 0 0 20px 0;">Hello,</h2>
            
            <p style="margin: 0 0 15px 0;">
              <strong>${providerName}</strong> from <strong>${practiceName || "their practice"}</strong> has invited you to review and sign a consent form:
            </p>
            
            <div style="background: #f8fafc; border-left: 4px solid #0ea5e9; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <strong style="color: #0ea5e9;">${moduleName}</strong>
            </div>
            
            ${customMessage ? `
              <div style="background: #fefce8; border: 1px solid #fef08a; padding: 15px 20px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0; font-style: italic; color: #854d0e;">"${customMessage}"</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #a16207;">— ${providerName}</p>
              </div>
            ` : ""}
            
            <p style="margin: 20px 0;">
              Please click the button below to review the consent information and provide your digital signature:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resolvedConsentLink}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Review & Sign Consent
              </a>
            </div>
            
            <p style="margin: 20px 0 0 0; font-size: 14px; color: #6b7280;">
              This link will expire in 7 days. If you have any questions, please contact your healthcare provider directly.
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              This email was sent by ClearConsent on behalf of ${practiceName || providerName}.
              <br>
              If you did not expect this email, you can safely ignore it.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "ClearConsent <noreply@santelishealth.com>",
      to: [patientEmail],
      subject: `Consent Request from ${providerName} - ${moduleName}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
