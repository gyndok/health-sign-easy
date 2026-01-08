import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeneratePdfRequest {
  submissionId: string;
  regenerate?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { submissionId, regenerate = true }: GeneratePdfRequest = await req.json();
    console.log("Consent PDF request:", { submissionId, regenerate });

    if (!submissionId) {
      throw new Error("submissionId is required");
    }

    // Fetch submission
    const { data: submission, error: fetchError } = await supabase
      .from("consent_submissions")
      .select("id, patient_first_name, patient_last_name, patient_email, signature, signed_at, created_at, provider_id, invite_id, module_id")
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      console.error("Error fetching submission:", fetchError);
      throw new Error("Submission not found");
    }

    const fileName = `${submission.provider_id}/${submission.id}.pdf`;

    // If caller only wants a URL and the PDF already exists, return a fresh signed URL.
    if (!regenerate) {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("consent-pdfs")
        .createSignedUrl(fileName, 60 * 60);

      if (!signedUrlError && signedUrlData?.signedUrl) {
        return new Response(
          JSON.stringify({ success: true, pdfUrl: signedUrlData.signedUrl }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.warn("Could not create signed URL; will regenerate PDF", signedUrlError);
    }

    // Fetch module + provider details
    const { data: module } = await supabase
      .from("consent_modules")
      .select("name, description")
      .eq("id", submission.module_id)
      .single();

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
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 60;
    const contentWidth = pageWidth - margin * 2;
    const lineHeight = 14;
    const sectionGap = 20;

    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPos = pageHeight - margin;

    // Helpers
    const sanitizeText = (text: string): string => {
      return text
        .replace(/[\n\r\t]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    };

    const wrapText = (text: string, maxWidth: number, font: typeof timesRoman, fontSize: number): string[] => {
      const sanitized = sanitizeText(text);
      const words = sanitized.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
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

    const ensureSpace = (needed: number) => {
      if (yPos - needed < margin) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        yPos = pageHeight - margin;
      }
    };

    const drawText = (
      text: string,
      options: { font?: typeof timesRoman; size?: number; color?: ReturnType<typeof rgb>; indent?: number } = {}
    ) => {
      const { font = helvetica, size = 10, color = rgb(0, 0, 0), indent = 0 } = options;
      currentPage.drawText(text, { x: margin + indent, y: yPos, size, font, color });
      yPos -= lineHeight;
    };

    const drawWrappedText = (
      text: string,
      options: { font?: typeof timesRoman; size?: number; color?: ReturnType<typeof rgb>; indent?: number } = {}
    ) => {
      const { font = helvetica, size = 10, color = rgb(0, 0, 0), indent = 0 } = options;
      const lines = wrapText(text, contentWidth - indent, font, size);
      for (const line of lines) {
        ensureSpace(lineHeight);
        drawText(line, { font, size, color, indent });
      }
    };

    const drawHr = () => {
      ensureSpace(12);
      currentPage.drawLine({
        start: { x: margin, y: yPos + 4 },
        end: { x: pageWidth - margin, y: yPos + 4 },
        thickness: 0.75,
        color: rgb(0.75, 0.75, 0.75),
      });
      yPos -= 12;
    };

    // ========== PAGE 1: Header & Patient Info ==========
    // Title
    currentPage.drawText("CONSENT FORM", {
      x: margin,
      y: yPos,
      size: 22,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    yPos -= 28;

    // Provider / Practice
    if (provider) {
      const practiceName = provider.practice_name || provider.full_name || "Healthcare Provider";
      currentPage.drawText(practiceName, {
        x: margin,
        y: yPos,
        size: 12,
        font: helveticaBold,
        color: rgb(0.25, 0.25, 0.25),
      });
      yPos -= 16;
      if (provider.practice_name && provider.full_name) {
        currentPage.drawText(`Provider: ${provider.full_name}`, {
          x: margin,
          y: yPos,
          size: 10,
          font: helvetica,
          color: rgb(0.4, 0.4, 0.4),
        });
        yPos -= 14;
      }
    }
    yPos -= sectionGap / 2;

    drawHr();

    // Procedure
    ensureSpace(40);
    currentPage.drawText("PROCEDURE / TREATMENT", {
      x: margin,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 16;
    currentPage.drawText(module?.name || "Consent Form", {
      x: margin,
      y: yPos,
      size: 14,
      font: timesRomanBold,
      color: rgb(0, 0, 0),
    });
    yPos -= sectionGap;

    // Patient Info Box
    drawHr();
    ensureSpace(60);
    currentPage.drawText("PATIENT INFORMATION", {
      x: margin,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 18;
    drawText(`Name: ${submission.patient_first_name} ${submission.patient_last_name}`, { font: helvetica, size: 11 });
    drawText(`Email: ${submission.patient_email}`, { font: helvetica, size: 11 });
    yPos -= sectionGap;

    // ========== CONSENT INFORMATION (module description) ==========
    if (module?.description) {
      drawHr();
      ensureSpace(40);
      currentPage.drawText("CONSENT INFORMATION", {
        x: margin,
        y: yPos,
        size: 11,
        font: helveticaBold,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 18;

      // Split into paragraphs
      const paragraphs = module.description.split(/\n+/).filter((p: string) => p.trim());
      for (const para of paragraphs) {
        drawWrappedText(para, { font: timesRoman, size: 10, color: rgb(0.15, 0.15, 0.15) });
        yPos -= 6; // extra space between paragraphs
      }
      yPos -= sectionGap / 2;
    }

    // ========== ACKNOWLEDGMENT ==========
    drawHr();
    ensureSpace(80);
    currentPage.drawText("ACKNOWLEDGMENT", {
      x: margin,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 18;

    const ackText =
      "I have reviewed all consent materials and understand the information provided. I voluntarily agree to the procedure/treatment described and understand the risks, benefits, and alternatives.";
    drawWrappedText(ackText, { font: timesRoman, size: 10 });
    yPos -= sectionGap;

    // ========== DIGITAL SIGNATURE ==========
    drawHr();
    ensureSpace(100);
    currentPage.drawText("DIGITAL SIGNATURE", {
      x: margin,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 20;

    // Signature box
    const sigBoxHeight = 36;
    currentPage.drawRectangle({
      x: margin,
      y: yPos - sigBoxHeight,
      width: 280,
      height: sigBoxHeight,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    });

    currentPage.drawText(submission.signature, {
      x: margin + 10,
      y: yPos - 24,
      size: 18,
      font: timesRoman,
      color: rgb(0, 0, 0.55),
    });
    yPos -= sigBoxHeight + 12;

    const signedDate = new Date(submission.signed_at).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    drawText(`Signed by: ${submission.patient_first_name} ${submission.patient_last_name}`, { font: helvetica, size: 10 });
    drawText(`Date: ${signedDate}`, { font: helvetica, size: 10 });
    drawText(`Submission ID: ${submission.id}`, { font: helvetica, size: 9, color: rgb(0.5, 0.5, 0.5) });

    // Footer on each page
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    for (let i = 0; i < totalPages; i++) {
      const pg = pages[i];
      pg.drawLine({
        start: { x: margin, y: margin - 10 },
        end: { x: pageWidth - margin, y: margin - 10 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
      pg.drawText("This document was electronically signed and is legally binding.", {
        x: margin,
        y: margin - 24,
        size: 8,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      });
      pg.drawText(`Generated by ClearConsent  •  Page ${i + 1} of ${totalPages}`, {
        x: margin,
        y: margin - 36,
        size: 8,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    console.log("PDF generated, size:", pdfBytes.length, "bytes");

    // Upload to storage
    const uploadBody = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength);
    const { error: uploadError } = await supabase.storage
      .from("consent-pdfs")
      .upload(fileName, uploadBody, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      console.error("Error uploading PDF:", uploadError);
      throw new Error("Failed to upload PDF: " + uploadError.message);
    }
    console.log("PDF uploaded successfully to:", fileName);

    // Get signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("consent-pdfs")
      .createSignedUrl(fileName, 60 * 60 * 24 * 365);

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError);
    }

    const pdfUrl = signedUrlData?.signedUrl || null;
    console.log("Signed URL created:", pdfUrl ? "success" : "failed");

    // Update submission with PDF URL
    await supabase.from("consent_submissions").update({ pdf_url: pdfUrl }).eq("id", submissionId);

    console.log("PDF generated and stored successfully");

    return new Response(JSON.stringify({ success: true, pdfUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating PDF:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
