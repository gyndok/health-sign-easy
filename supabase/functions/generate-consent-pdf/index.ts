import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeneratePdfRequest {
  submissionId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { submissionId }: GeneratePdfRequest = await req.json();
    console.log("Generating PDF for submission:", submissionId);

    if (!submissionId) {
      throw new Error("submissionId is required");
    }

    // Fetch submission with related data
    const { data: submission, error: fetchError } = await supabase
      .from("consent_submissions")
      .select(`
        id,
        patient_first_name,
        patient_last_name,
        patient_email,
        signature,
        signed_at,
        created_at,
        provider_id,
        invite_id,
        module_id
      `)
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      console.error("Error fetching submission:", fetchError);
      throw new Error("Submission not found");
    }

    // Fetch module details
    const { data: module } = await supabase
      .from("consent_modules")
      .select("name, description")
      .eq("id", submission.module_id)
      .single();

    // Fetch provider details
    const { data: provider } = await supabase
      .from("provider_profiles")
      .select("full_name, practice_name")
      .eq("user_id", submission.provider_id)
      .single();

    console.log("Creating PDF document...");

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    
    const margin = 50;
    let yPosition = height - margin;
    const lineHeight = 16;
    const sectionSpacing = 24;

    // Helper function to draw text
    const drawText = (text: string, options: { 
      font?: typeof timesRoman, 
      size?: number, 
      color?: ReturnType<typeof rgb>,
      indent?: number 
    } = {}) => {
      const { font = timesRoman, size = 12, color = rgb(0, 0, 0), indent = 0 } = options;
      page.drawText(text, {
        x: margin + indent,
        y: yPosition,
        size,
        font,
        color,
      });
      yPosition -= lineHeight;
    };

    // Helper to sanitize text for PDF (remove unsupported characters)
    const sanitizeText = (text: string): string => {
      return text
        .replace(/[\n\r\t]/g, ' ')  // Replace newlines/tabs with spaces
        .replace(/\s+/g, ' ')       // Collapse multiple spaces
        .trim();
    };

    // Helper to wrap text
    const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
      const sanitized = sanitizeText(text);
      const words = sanitized.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = timesRoman.widthOfTextAtSize(testLine, fontSize);
        
        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    // Header
    drawText("SIGNED CONSENT FORM", { font: timesRomanBold, size: 18 });
    yPosition -= 8;
    
    // Provider info
    if (provider) {
      drawText(provider.practice_name || provider.full_name || "Healthcare Provider", { size: 14, font: timesRomanBold });
    }
    yPosition -= sectionSpacing;

    // Horizontal line
    page.drawLine({
      start: { x: margin, y: yPosition + 10 },
      end: { x: width - margin, y: yPosition + 10 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    yPosition -= 10;

    // Module name
    drawText("Procedure/Treatment:", { font: timesRomanBold, size: 12 });
    drawText(module?.name || "Consent Form", { size: 12, indent: 10 });
    yPosition -= sectionSpacing / 2;

    // Patient Information Section
    drawText("PATIENT INFORMATION", { font: timesRomanBold, size: 14 });
    yPosition -= 4;
    drawText(`Name: ${submission.patient_first_name} ${submission.patient_last_name}`, { size: 12 });
    drawText(`Email: ${submission.patient_email}`, { size: 12 });
    yPosition -= sectionSpacing;

    // Consent Information Section
    if (module?.description) {
      drawText("CONSENT INFORMATION", { font: timesRomanBold, size: 14 });
      yPosition -= 4;
      
      const descriptionLines = wrapText(module.description, width - (margin * 2) - 20, 11);
      for (const line of descriptionLines) {
        if (yPosition < margin + 150) {
          // Add new page if running out of space
          const newPage = pdfDoc.addPage([612, 792]);
          yPosition = height - margin;
        }
        drawText(line, { size: 11, color: rgb(0.2, 0.2, 0.2) });
      }
      yPosition -= sectionSpacing;
    }

    // Acknowledgment Section
    drawText("ACKNOWLEDGMENT", { font: timesRomanBold, size: 14 });
    yPosition -= 4;
    const ackText = "I have reviewed all consent materials and understand the information provided. I voluntarily agree to the procedure/treatment described and understand the risks, benefits, and alternatives.";
    const ackLines = wrapText(ackText, width - (margin * 2) - 20, 11);
    for (const line of ackLines) {
      drawText(line, { size: 11 });
    }
    yPosition -= sectionSpacing;

    // Signature Section
    page.drawLine({
      start: { x: margin, y: yPosition + 10 },
      end: { x: width - margin, y: yPosition + 10 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    yPosition -= 10;

    drawText("DIGITAL SIGNATURE", { font: timesRomanBold, size: 14 });
    yPosition -= 8;
    
    // Signature box
    page.drawRectangle({
      x: margin,
      y: yPosition - 30,
      width: 300,
      height: 40,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });
    
    page.drawText(submission.signature, {
      x: margin + 10,
      y: yPosition - 15,
      size: 16,
      font: timesRoman,
      color: rgb(0, 0, 0.6),
    });
    
    yPosition -= 50;

    // Signature details
    const signedDate = new Date(submission.signed_at).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
    
    drawText(`Signed by: ${submission.patient_first_name} ${submission.patient_last_name}`, { size: 11 });
    drawText(`Date: ${signedDate}`, { size: 11 });
    drawText(`Submission ID: ${submission.id}`, { size: 10, color: rgb(0.5, 0.5, 0.5) });
    
    yPosition -= sectionSpacing;

    // Footer
    page.drawLine({
      start: { x: margin, y: margin + 30 },
      end: { x: width - margin, y: margin + 30 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    
    page.drawText("This document was electronically signed and is legally binding.", {
      x: margin,
      y: margin + 15,
      size: 9,
      font: timesRoman,
      color: rgb(0.5, 0.5, 0.5),
    });

    page.drawText(`Generated by ClearConsent on ${new Date().toLocaleDateString()}`, {
      x: margin,
      y: margin,
      size: 9,
      font: timesRoman,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    console.log("PDF generated, size:", pdfBytes.length, "bytes");

    // Upload to storage (convert to ArrayBuffer for compatibility)
    const fileName = `${submission.provider_id}/${submission.id}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("consent-pdfs")
      .upload(fileName, pdfBytes.buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading PDF:", uploadError);
      throw new Error("Failed to upload PDF: " + uploadError.message);
    }

    console.log("PDF uploaded successfully to:", fileName);

    // Get signed URL for the PDF (valid for 1 year)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("consent-pdfs")
      .createSignedUrl(fileName, 60 * 60 * 24 * 365);

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError);
    }

    const pdfUrl = signedUrlData?.signedUrl || null;
    console.log("Signed URL created:", pdfUrl ? "success" : "failed");

    // Update submission with PDF URL
    const { error: updateError } = await supabase
      .from("consent_submissions")
      .update({ pdf_url: pdfUrl })
      .eq("id", submissionId);

    if (updateError) {
      console.error("Error updating submission with PDF URL:", updateError);
    }

    console.log("PDF generated and stored successfully");

    return new Response(
      JSON.stringify({ success: true, pdfUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating PDF:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});