import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { noteText } = await req.json();
    if (!noteText || typeof noteText !== "string") {
      return new Response(JSON.stringify({ error: "noteText is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("KEY_AI");
    if (!LOVABLE_API_KEY) throw new Error("API is not configured");

    const response = await fetch("", {
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
            content: `You are a medical information extraction assistant. Extract structured data from doctor's notes. Be precise and conservative — if information isn't clearly stated, say "Not specified" rather than guessing.`,
          },
          {
            role: "user",
            content: `Extract the following from this doctor's note:\n\n${noteText}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_medical_info",
              description: "Extract structured medical information from a doctor's note",
              parameters: {
                type: "object",
                properties: {
                  patientName: { type: "string", description: "Patient's full name" },
                  diagnosis: { type: "string", description: "Primary diagnosis" },
                  icdCodes: { type: "string", description: "ICD-10 codes if mentioned, comma-separated" },
                  requestedTreatment: { type: "string", description: "The treatment or procedure being requested" },
                  clinicalHistory: { type: "string", description: "Brief summary of relevant clinical history, prior treatments, and current symptoms" },
                },
                required: ["patientName", "diagnosis", "icdCodes", "requestedTreatment", "clinicalHistory"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_medical_info" } },
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
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-medical-info error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
