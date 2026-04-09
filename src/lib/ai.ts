import { supabase } from "@/integrations/supabase/client";
import { ExtractedInfo } from "./types";

export async function extractMedicalInfo(noteText: string): Promise<ExtractedInfo> {
  const { data, error } = await supabase.functions.invoke("extract-medical-info", {
    body: { noteText },
  });

  if (error) throw new Error(error.message || "Failed to extract medical info");
  return data as ExtractedInfo;
}

export async function generateJustification(params: {
  extractedInfo: ExtractedInfo;
  ruleName: string | null;
  metCriteria: string[];
  missingCriteria: string[];
  overrideNote?: string;
  generationMode?: "initial" | "optimized" | "appeal";
}): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-justification", {
    body: params,
  });

  if (error) throw new Error(error.message || "Failed to generate justification");
  return data.justification as string;
}
