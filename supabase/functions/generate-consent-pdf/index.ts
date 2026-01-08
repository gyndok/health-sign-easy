import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeneratePdfRequest {
  submissionId: string;
  regenerate?: boolean;
}

// Color palette
const COLORS = {
  black: rgb(0, 0, 0),
  darkGray: rgb(0.2, 0.2, 0.2),
  gray: rgb(0.4, 0.4, 0.4),
  lightGray: rgb(0.6, 0.6, 0.6),
  border: rgb(0.75, 0.75, 0.75),
  lightBorder: rgb(0.85, 0.85, 0.85),
  accent: rgb(0.1, 0.3, 0.6),
  signatureBlue: rgb(0.05, 0.15, 0.5),
  boxBg: rgb(0.97, 0.97, 0.97),
};

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

    // Return existing signed URL if not regenerating
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
      .select("full_name, practice_name, timezone")
      .eq("user_id", submission.provider_id)
      .single();

    console.log("Creating PDF document...");

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

    const PAGE_WIDTH = 612;
    const PAGE_HEIGHT = 792;
    const MARGIN = 54;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
    const FOOTER_HEIGHT = 50;

    let currentPage: PDFPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let yPos = PAGE_HEIGHT - MARGIN;

    // ----- HELPERS -----
    const sanitize = (text: string): string =>
      text.replace(/[\n\r\t]/g, " ").replace(/\s+/g, " ").trim();

    const wrapText = (text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] => {
      const words = sanitize(text).split(" ");
      const lines: string[] = [];
      let line = "";
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, fontSize) > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      return lines;
    };

    const ensureSpace = (needed: number) => {
      if (yPos - needed < MARGIN + FOOTER_HEIGHT) {
        currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        yPos = PAGE_HEIGHT - MARGIN;
      }
    };

    const drawLine = (y: number, color = COLORS.border, thickness = 0.75) => {
      currentPage.drawLine({
        start: { x: MARGIN, y },
        end: { x: PAGE_WIDTH - MARGIN, y },
        thickness,
        color,
      });
    };

    // Draw a boxed section with header
    const drawSectionBox = (title: string, contentFn: () => void) => {
      ensureSpace(60);

      // Section header bar
      const headerHeight = 24;
      const fontSize = 10;
      const headerFontHeight = helveticaBold.heightAtSize(fontSize);
      // Center text visually inside the header bar (baseline positioning)
      const textY = yPos - headerHeight + (headerHeight - headerFontHeight) / 2;

      currentPage.drawRectangle({
        x: MARGIN,
        y: yPos - headerHeight,
        width: CONTENT_WIDTH,
        height: headerHeight,
        color: COLORS.accent,
      });
      currentPage.drawText(title, {
        x: MARGIN + 10,
        y: textY,
        size: fontSize,
        font: helveticaBold,
        color: rgb(1, 1, 1),
      });
      yPos -= headerHeight + 8;

      // Content area
      const startY = yPos;
      contentFn();
      const endY = yPos;

      // Box around content (add more top padding so the border doesn't cut through large text)
      const paddingTop = 16;
      const paddingBottom = 10;
      const boxHeight = startY - endY + paddingTop + paddingBottom;
      currentPage.drawRectangle({
        x: MARGIN,
        y: endY - paddingBottom,
        width: CONTENT_WIDTH,
        height: boxHeight,
        borderColor: COLORS.border,
        borderWidth: 0.75,
        color: COLORS.boxBg,
        opacity: 0,
      });

      yPos -= 16;
    };

    const drawLabelValue = (label: string, value: string, indent = 0) => {
      ensureSpace(16);
      currentPage.drawText(label, {
        x: MARGIN + 8 + indent,
        y: yPos,
        size: 9,
        font: helveticaBold,
        color: COLORS.gray,
      });
      const labelWidth = helveticaBold.widthOfTextAtSize(label, 9);
      currentPage.drawText(value, {
        x: MARGIN + 8 + indent + labelWidth + 6,
        y: yPos,
        size: 10,
        font: helvetica,
        color: COLORS.black,
      });
      yPos -= 16;
    };

    const drawParagraph = (text: string, indent = 0) => {
      const lines = wrapText(text, timesRoman, 10, CONTENT_WIDTH - 16 - indent);
      for (const line of lines) {
        ensureSpace(14);
        currentPage.drawText(line, {
          x: MARGIN + 8 + indent,
          y: yPos,
          size: 10,
          font: timesRoman,
          color: COLORS.darkGray,
        });
        yPos -= 14;
      }
      yPos -= 4;
    };

    const drawBullet = (text: string, indent = 0) => {
      const bulletX = MARGIN + 8 + indent;
      const textX = bulletX + 12;
      const lines = wrapText(text, timesRoman, 10, CONTENT_WIDTH - 24 - indent);

      for (let i = 0; i < lines.length; i++) {
        ensureSpace(14);
        if (i === 0) {
          currentPage.drawText("•", {
            x: bulletX,
            y: yPos,
            size: 10,
            font: helvetica,
            color: COLORS.accent,
          });
        }
        currentPage.drawText(lines[i], {
          x: textX,
          y: yPos,
          size: 10,
          font: timesRoman,
          color: COLORS.darkGray,
        });
        yPos -= 14;
      }
    };

    const drawSubheading = (text: string) => {
      ensureSpace(24);
      yPos -= 6;
      currentPage.drawText(text, {
        x: MARGIN + 8,
        y: yPos,
        size: 11,
        font: helveticaBold,
        color: COLORS.accent,
      });
      yPos -= 16;
    };

    // Parse description into structured sections
    interface Section {
      heading?: string;
      paragraphs: string[];
      bullets: string[];
    }

    const parseDescription = (desc: string): Section[] => {
      const sections: Section[] = [];
      const lines = desc.split(/\n+/);
      let current: Section = { paragraphs: [], bullets: [] };

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        // Check for heading patterns
        if (line.startsWith("# ")) {
          if (current.heading || current.paragraphs.length || current.bullets.length) {
            sections.push(current);
          }
          current = { heading: line.slice(2).trim(), paragraphs: [], bullets: [] };
        } else if (line.startsWith("- ") || line.startsWith("• ")) {
          current.bullets.push(line.slice(2).trim());
        } else if (/^[A-Z][^.!?]*$/.test(line) && line.length < 80) {
          // Short capitalized line without period → treat as heading
          if (current.heading || current.paragraphs.length || current.bullets.length) {
            sections.push(current);
          }
          current = { heading: line, paragraphs: [], bullets: [] };
        } else {
          current.paragraphs.push(line);
        }
      }
      if (current.heading || current.paragraphs.length || current.bullets.length) {
        sections.push(current);
      }
      return sections;
    };

    // ========== PAGE CONTENT ==========

    // Header
    currentPage.drawText("CONSENT FORM", {
      x: MARGIN,
      y: yPos,
      size: 24,
      font: helveticaBold,
      color: COLORS.black,
    });
    yPos -= 30;

    // Provider / Practice
    if (provider) {
      const practiceName = provider.practice_name || provider.full_name || "";
      if (practiceName) {
        currentPage.drawText(practiceName, {
          x: MARGIN,
          y: yPos,
          size: 12,
          font: helveticaBold,
          color: COLORS.darkGray,
        });
        yPos -= 16;
      }
      if (provider.practice_name && provider.full_name) {
        currentPage.drawText(`Provider: ${provider.full_name}`, {
          x: MARGIN,
          y: yPos,
          size: 10,
          font: helvetica,
          color: COLORS.gray,
        });
        yPos -= 14;
      }
    }

    yPos -= 8;
    drawLine(yPos);
    yPos -= 16;

    // Procedure
    drawSectionBox("PROCEDURE / TREATMENT", () => {
      currentPage.drawText(module?.name || "Consent Form", {
        x: MARGIN + 8,
        y: yPos,
        size: 14,
        font: helveticaBold,
        color: COLORS.black,
      });
      yPos -= 18;
    });

    // Patient Info
    drawSectionBox("PATIENT INFORMATION", () => {
      drawLabelValue("Name:", `${submission.patient_first_name} ${submission.patient_last_name}`);
      drawLabelValue("Email:", submission.patient_email);
    });

    // Consent Information
    if (module?.description) {
      drawSectionBox("CONSENT INFORMATION", () => {
        const sections = parseDescription(module.description);

        for (const section of sections) {
          if (section.heading) {
            drawSubheading(section.heading);
          }
          for (const para of section.paragraphs) {
            drawParagraph(para, section.heading ? 0 : 0);
          }
          for (const bullet of section.bullets) {
            drawBullet(bullet);
          }
        }
      });
    }

    // Acknowledgment
    drawSectionBox("ACKNOWLEDGMENT", () => {
      const ackText =
        "I have reviewed all consent materials and understand the information provided. I voluntarily agree to the procedure/treatment described and understand the risks, benefits, and alternatives.";
      drawParagraph(ackText);
    });

    // Signature Section (force new page if not enough space)
    ensureSpace(180);

    drawSectionBox("DIGITAL SIGNATURE", () => {
      // Signature box
      const sigBoxWidth = 280;
      const sigBoxHeight = 44;
      currentPage.drawRectangle({
        x: MARGIN + 8,
        y: yPos - sigBoxHeight,
        width: sigBoxWidth,
        height: sigBoxHeight,
        borderColor: COLORS.border,
        borderWidth: 1,
        color: rgb(1, 1, 1),
      });

      // Signature text
      currentPage.drawText(submission.signature, {
        x: MARGIN + 16,
        y: yPos - 30,
        size: 20,
        font: timesItalic,
        color: COLORS.signatureBlue,
      });

      yPos -= sigBoxHeight + 12;

      // Signed info
      // Use provider's timezone if available, default to UTC
      const timezone = provider?.timezone || "UTC";
      const signedDate = new Date(submission.signed_at).toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: timezone,
        timeZoneName: "short",
      });

      drawLabelValue("Signed by:", `${submission.patient_first_name} ${submission.patient_last_name}`);
      drawLabelValue("Date:", signedDate);
      yPos -= 4;
      currentPage.drawText(`Submission ID: ${submission.id}`, {
        x: MARGIN + 8,
        y: yPos,
        size: 8,
        font: helvetica,
        color: COLORS.lightGray,
      });
      yPos -= 12;
    });

    // Footer on each page
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    for (let i = 0; i < totalPages; i++) {
      const pg = pages[i];
      pg.drawLine({
        start: { x: MARGIN, y: MARGIN },
        end: { x: PAGE_WIDTH - MARGIN, y: MARGIN },
        thickness: 0.5,
        color: COLORS.lightBorder,
      });
      pg.drawText("This document was electronically signed and is legally binding.", {
        x: MARGIN,
        y: MARGIN - 12,
        size: 8,
        font: helvetica,
        color: COLORS.lightGray,
      });
      pg.drawText(`Generated by ClearConsent  •  Page ${i + 1} of ${totalPages}`, {
        x: MARGIN,
        y: MARGIN - 24,
        size: 8,
        font: helvetica,
        color: COLORS.lightGray,
      });
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    console.log("PDF generated, size:", pdfBytes.length, "bytes");

    // Upload
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

    // Update submission
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
