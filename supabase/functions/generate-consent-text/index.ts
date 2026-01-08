import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { procedureName, procedureDescription, additionalContext } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a medical consent document specialist. Your role is to generate clear, comprehensive, and legally appropriate consent text for medical procedures.

Guidelines:
- Write in clear, patient-friendly language (8th grade reading level)
- Include all standard consent elements: nature of procedure, risks, benefits, alternatives
- Be thorough but concise
- Use proper medical terminology where necessary, but explain terms
- Format with clear sections and paragraphs
- Do NOT include signature lines or checkboxes (those are added separately)
- Do NOT include the title/procedure name at the top (that's handled separately)

The consent text should cover:
1. Description of the procedure
2. Purpose and expected benefits
3. Potential risks and complications
4. Alternative treatments or options
5. What to expect during recovery
6. Patient responsibilities`;

    const userPrompt = `Generate consent text for the following medical procedure:

Procedure Name: ${procedureName}
${procedureDescription ? `\nProcedure Description: ${procedureDescription}` : ''}
${additionalContext ? `\nAdditional Context: ${additionalContext}` : ''}

Please generate comprehensive consent text that a patient would review and sign before undergoing this procedure.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate consent text");
    }

    const data = await response.json();
    const consentText = data.choices?.[0]?.message?.content;

    if (!consentText) {
      throw new Error("No content generated");
    }

    return new Response(
      JSON.stringify({ consentText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating consent text:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
