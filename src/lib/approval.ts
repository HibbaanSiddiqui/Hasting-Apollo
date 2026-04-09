export interface ApprovalReadiness {
  score: number;
  level: "high" | "medium" | "low";
  basis: string;
  riskNote: string | null;
  missingFocus: string[];
  strongCount: number;
  moderateCount: number;
  gapCount: number;
}

function hasExplicitProgression(noteText: string): boolean {
  const lower = noteText.toLowerCase();
  const progressionSignals = [
    "worsening",
    "progressive",
    "progressively",
    "increasing",
    "worse over",
    "decline",
    "deteriorat",
  ];
  return progressionSignals.some((token) => lower.includes(token));
}

export function getApprovalReadiness(
  metCriteria: string[],
  missingCriteria: string[],
  noteText: string
): ApprovalReadiness {
  const total = metCriteria.length + missingCriteria.length;
  if (total === 0) {
    return {
      score: 55,
      level: "medium",
      basis: "No rule-specific criteria were detected.",
      riskNote: "Approval depends on overall clinical narrative quality.",
      missingFocus: [],
      strongCount: 0,
      moderateCount: 0,
      gapCount: 0,
    };
  }

  const rawScore = Math.round((metCriteria.length / total) * 100);
  const missingFocus = missingCriteria.slice(0, 3);
  const hasProgressionCriterion = [...metCriteria, ...missingCriteria].some((criterion) =>
    criterion.toLowerCase().includes("progressive neurological symptoms")
  );
  const explicitProgression = hasExplicitProgression(noteText);
  const progressionRisk = hasProgressionCriterion && !explicitProgression;
  const progressionInMet = metCriteria.some((criterion) =>
    criterion.toLowerCase().includes("progressive neurological symptoms")
  );
  const moderateCount = progressionRisk && progressionInMet ? 1 : 0;
  const strongCount = Math.max(0, metCriteria.length - moderateCount);
  const gapCount = missingCriteria.length + (progressionRisk && progressionInMet ? 1 : 0);

  // Keep confidence calibrated: never show 100% for PA prediction.
  const cappedScore = Math.min(rawScore, 85);
  const score = progressionRisk ? Math.max(60, cappedScore - 10) : cappedScore;
  const level = score >= 75 ? "high" : score >= 55 ? "medium" : "low";
  const basis = `Based on ${strongCount} fully supported criteria + ${moderateCount} partially supported.`;
  const riskNote = progressionRisk
    ? "Risk: progression is not explicitly documented."
    : missingFocus.length > 0
      ? `Risk: ${missingFocus[0]}`
      : null;

  return { score, level, basis, riskNote, missingFocus, strongCount, moderateCount, gapCount };
}

export function buildApprovalImprovementPlan(missingCriteria: string[], noteText: string): string {
  if (missingCriteria.length === 0) {
    return "Current documentation already supports all matched rule criteria. Emphasize objective findings and functional impact.";
  }

  const suggestions = missingCriteria.map((criterion) => {
    const lower = criterion.toLowerCase();

    if (lower.includes("conservative treatment")) {
      return `- Document timeline and response to conservative treatment to directly address: "${criterion}".`;
    }
    if (lower.includes("physical therapy") || lower.includes("pt")) {
      return `- Add PT session count, dates, and therapist notes to support: "${criterion}".`;
    }
    if (lower.includes("neurological") || lower.includes("red flags")) {
      return `- Document worsening symptoms over time or functional decline, plus objective exam findings, tied to: "${criterion}".`;
    }
    if (lower.includes("imaging")) {
      return `- Reference imaging results and radiology impression for: "${criterion}".`;
    }
    if (lower.includes("functional")) {
      return `- Add ADL/work limitations to strengthen: "${criterion}".`;
    }

    return `- Add direct chart evidence for: "${criterion}".`;
  });

  return [
    "Approval optimization notes:",
    ...suggestions,
    noteText.toLowerCase().includes("worsening") || noteText.toLowerCase().includes("progress")
      ? '- Reinforce the timeline in the letter: "Symptoms have progressively worsened over the past 8 weeks, with increasing pain intensity and functional limitation."'
      : '- Consider adding this clinically accurate line if supported by chart review: "Symptoms have progressively worsened over the past 8 weeks, with increasing pain intensity and functional limitation."',
    "- Regenerate the letter to explicitly connect each criterion to chart evidence.",
  ].join("\n");
}
