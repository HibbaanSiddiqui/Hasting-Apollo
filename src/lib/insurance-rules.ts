export interface InsuranceRule {
  id: string;
  name: string;
  treatment: string;
  requiredCriteria: string[];
  description: string;
}

export const INSURANCE_RULES: InsuranceRule[] = [
  {
    id: "mri-spine",
    name: "MRI — Spine",
    treatment: "MRI",
    requiredCriteria: [
      "Failed conservative treatment for 6+ weeks",
      "Documented physical therapy attempt",
      "Progressive neurological symptoms or red flags",
    ],
    description: "Spinal MRI requires documented failure of conservative treatment (PT, medications) for at least 6 weeks, unless red flag symptoms are present.",
  },
  {
    id: "surgery-knee",
    name: "Knee Arthroscopy",
    treatment: "surgery",
    requiredCriteria: [
      "Failed conservative treatment for 12+ weeks",
      "Imaging confirming structural damage",
      "Functional limitation documented",
    ],
    description: "Knee arthroscopy requires imaging evidence, documented functional limitations, and failure of 12+ weeks of conservative management.",
  },
  {
    id: "specialty-medication",
    name: "Specialty Medication",
    treatment: "medication",
    requiredCriteria: [
      "Step therapy — failed first-line treatments",
      "Documented diagnosis with supporting labs",
      "Prior authorization from prescribing specialist",
    ],
    description: "Specialty medications require step therapy documentation, lab-confirmed diagnosis, and specialist prescription.",
  },
  {
    id: "ct-scan",
    name: "CT Scan",
    treatment: "CT scan",
    requiredCriteria: [
      "Clinical indication documented",
      "Non-invasive testing inconclusive",
      "Symptom duration > 2 weeks or acute presentation",
    ],
    description: "CT scans require clinical indication, inconclusive prior testing, and symptom documentation.",
  },
  {
    id: "physical-therapy-extended",
    name: "Extended Physical Therapy",
    treatment: "physical therapy",
    requiredCriteria: [
      "Initial PT course completed (12+ sessions)",
      "Documented functional improvement but incomplete recovery",
      "Physician order for continued therapy",
    ],
    description: "Extended PT beyond initial authorization requires documented partial improvement and physician reorder.",
  },
];

export function matchRules(treatment: string, clinicalHistory: string): {
  matchedRule: InsuranceRule | null;
  metCriteria: string[];
  missingCriteria: string[];
} {
  const treatmentLower = treatment.toLowerCase();
  const historyLower = clinicalHistory.toLowerCase();

  const matchedRule = INSURANCE_RULES.find((rule) =>
    treatmentLower.includes(rule.treatment.toLowerCase())
  );

  if (!matchedRule) {
    return { matchedRule: null, metCriteria: [], missingCriteria: [] };
  }

  const metCriteria: string[] = [];
  const missingCriteria: string[] = [];

  for (const criterion of matchedRule.requiredCriteria) {
    const keywords = criterion.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const matched = keywords.some((kw) => historyLower.includes(kw));
    if (matched) {
      metCriteria.push(criterion);
    } else {
      missingCriteria.push(criterion);
    }
  }

  return { matchedRule, metCriteria, missingCriteria };
}
