export interface ExtractedInfo {
  patientName: string;
  diagnosis: string;
  icdCodes: string;
  requestedTreatment: string;
  clinicalHistory: string;
}

export interface Submission {
  id: string;
  createdAt: string;
  patientName: string;
  status: "draft" | "reviewed";
  noteText: string;
  extractedInfo: ExtractedInfo | null;
  justification: string | null;
  ruleMatch: {
    ruleName: string | null;
    metCriteria: string[];
    missingCriteria: string[];
    overrideNote: string;
  } | null;
}
