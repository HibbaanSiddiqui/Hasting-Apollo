import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      extractedInfo,
      ruleName,
      metCriteria,
      missingCriteria,
      overrideNote,
      generationMode,
    } = await req.json();
    if (!extractedInfo) {
      return new Response(JSON.stringify({ error: "extractedInfo is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const ruleContext = ruleName
      ? `Insurance Rule: ${ruleName}\nMet Criteria: ${metCriteria.join("; ")}\nMissing Criteria: ${missingCriteria.join("; ")}`
      : "No specific insurance rule matched. Write a general medical necessity justification.";
    const optimizationContext = overrideNote
      ? `Additional reviewer context to strengthen approval: ${overrideNote}`
      : "No additional optimization context provided.";
    const modeContext =
      generationMode === "appeal"
        ? "This is an appeal draft after prior denial. Use stronger evidence framing and address likely denial reasons directly."
        : generationMode === "optimized"
          ? "This letter is an optimized submission. Prioritize missing criteria and explicitly connect evidence to insurer requirements."
          : "This is an initial justification draft.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a medical necessity justification writer for prior authorization requests. Write clear, professional, and persuasive letters. Use clinical language but keep it readable. The letter should be ready for submission to an insurance company. Include: patient identification, clinical background, medical necessity rationale, and a clear request for authorization. If criteria are missing, acknowledge them and provide the strongest possible justification anyway.`,
          },
          {
            role: "user",
            content: `Write a medical necessity justification letter for this prior authorization request:

Patient: ${extractedInfo.patientName}
Diagnosis: ${extractedInfo.diagnosis}
ICD Codes: ${extractedInfo.icdCodes}
Requested Treatment: ${extractedInfo.requestedTreatment}
Clinical History: ${extractedInfo.clinicalHistory}

${ruleContext}
${optimizationContext}
${modeContext}

Write the full letter now. Do not include placeholders — use the information provided. Start with "To Whom It May Concern" and end with a professional sign-off.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const justification = data.choices?.[0]?.message?.content;
    if (!justification) throw new Error("No content in response");

    return new Response(JSON.stringify({ justification }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-justification error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
