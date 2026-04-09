import { CheckCircle2, AlertTriangle, Info, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getApprovalReadiness } from "@/lib/approval";

interface RuleMatchPanelProps {
  ruleName: string | null;
  metCriteria: string[];
  missingCriteria: string[];
  overrideNote: string;
  noteText: string;
  isImproving?: boolean;
  onImproveApproval: () => void;
  onAutoAddToJustification: () => void;
  canAutoAddToJustification?: boolean;
  onOverrideChange: (note: string) => void;
}

function getEvidenceSnippet(criterion: string, noteText: string): string | null {
  if (!noteText.trim()) return null;
  const sentenceCandidates = noteText.split(/(?<=[.!?])\s+/).filter(Boolean);
  const tokens = criterion
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 4);

  for (const sentence of sentenceCandidates) {
    const lowerSentence = sentence.toLowerCase();
    const matched = tokens.some((token) => lowerSentence.includes(token));
    if (matched) return sentence;
  }
  return null;
}

function hasProgressionLanguage(noteText: string): boolean {
  const lower = noteText.toLowerCase();
  return ["worsening", "progressive", "progressively", "increasing", "worse over", "decline"].some((token) =>
    lower.includes(token)
  );
}

function getBreakdownStatus(
  key: "conservative" | "pt" | "progression",
  metCriteria: string[],
  missingCriteria: string[],
  progressionExplicit: boolean
): "Strong" | "Moderate" | "Gap" {
  const source = [...metCriteria, ...missingCriteria].map((criterion) => criterion.toLowerCase());
  const inMet = (token: string) => metCriteria.some((criterion) => criterion.toLowerCase().includes(token));
  const inMissing = (token: string) => missingCriteria.some((criterion) => criterion.toLowerCase().includes(token));

  if (key === "conservative") {
    if (!source.some((criterion) => criterion.includes("conservative"))) return "Moderate";
    return inMissing("conservative") ? "Gap" : "Strong";
  }
  if (key === "pt") {
    if (!source.some((criterion) => criterion.includes("physical therapy") || criterion.includes("pt"))) return "Moderate";
    return inMissing("physical therapy") || inMissing("pt") ? "Gap" : "Strong";
  }

  if (!source.some((criterion) => criterion.includes("progressive neurological symptoms"))) return "Moderate";
  if (inMissing("progressive neurological symptoms")) return "Gap";
  if (inMet("progressive neurological symptoms") && !progressionExplicit) return "Moderate";
  return "Strong";
}

export function RuleMatchPanel({
  ruleName,
  metCriteria,
  missingCriteria,
  overrideNote,
  noteText,
  isImproving = false,
  onImproveApproval,
  onAutoAddToJustification,
  canAutoAddToJustification = false,
  onOverrideChange,
}: RuleMatchPanelProps) {
  if (!ruleName) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Info className="h-5 w-5" />
            <p className="text-sm">No matching insurance rule found for this treatment. You can still generate a justification.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allMet = missingCriteria.length === 0;
  const progressionInMet = metCriteria.find((criterion) =>
    criterion.toLowerCase().includes("progressive neurological symptoms")
  );
  const progressionExplicit = hasProgressionLanguage(noteText);
  const readiness = getApprovalReadiness(metCriteria, missingCriteria, noteText);
  const readinessLabel = readiness.level === "high" ? "High" : readiness.level === "medium" ? "Medium" : "Low";
  const readinessTone =
    readiness.level === "high"
      ? "text-success border-success/40"
      : readiness.level === "medium"
        ? "text-warning border-warning/40"
        : "text-destructive border-destructive/40";
  const conservativeStatus = getBreakdownStatus("conservative", metCriteria, missingCriteria, progressionExplicit);
  const ptStatus = getBreakdownStatus("pt", metCriteria, missingCriteria, progressionExplicit);
  const progressionStatus = getBreakdownStatus("progression", metCriteria, missingCriteria, progressionExplicit);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          {allMet ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-warning" />
          )}
          Rule: {ruleName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border p-3 bg-secondary/30">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Approval Readiness Score</p>
            <Badge variant="outline" className={readinessTone}>
              {readinessLabel} likelihood ({readiness.score}%)
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{readiness.basis}</p>
          {readiness.riskNote && <p className="text-xs text-warning mt-1">{"\u26A0"} {readiness.riskNote}</p>}
          <Button size="sm" className="mt-3" onClick={onImproveApproval} disabled={isImproving}>
            {isImproving ? "Improving..." : "Improve Approval Chances"}
          </Button>
        </div>

        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-sm font-medium">Approval Breakdown</p>
          <div className="flex items-start gap-2 text-sm">
            {conservativeStatus === "Gap" ? (
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
            )}
            <span>Conservative treatment - {conservativeStatus}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            {ptStatus === "Gap" ? (
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
            )}
            <span>Physical therapy - {ptStatus}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            {progressionStatus === "Strong" ? (
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            )}
            <span>Neurological progression - {progressionStatus}</span>
          </div>
        </div>

        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-sm font-medium">Criteria Coverage</p>
          {metCriteria.length > 0 ? (
            metCriteria.map((c, i) => {
              const isProgressionCriterion = c.toLowerCase().includes("progressive neurological symptoms");
              const shouldWarnForProgression = isProgressionCriterion && !progressionExplicit;
              const evidence = getEvidenceSnippet(c, noteText);

              return (
              <div key={i} className="flex items-start gap-2 text-sm">
                {shouldWarnForProgression ? (
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                )}
                <div className="space-y-1">
                  <span>
                    {shouldWarnForProgression
                      ? "Neurological progression - inferred from symptoms (not explicitly documented)"
                      : c}
                  </span>
                  {evidence && (
                    <div className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{evidence}</span>
                    </div>
                  )}
                </div>
              </div>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground">No criteria are currently marked as met.</p>
          )}
          {missingCriteria.length > 0 &&
            missingCriteria.slice(0, 2).map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{c} — addressed in justification strategy</span>
              </div>
            ))}
        </div>

        {(missingCriteria.length > 0 || progressionInMet) && (
          <div className="pt-2 space-y-2">
            <div className="rounded-lg border border-dashed p-3 bg-secondary/30">
              <p className="text-sm font-medium">Suggested Improvement (AI)</p>
              <p className="text-xs text-muted-foreground mt-1">
                Explicitly document symptom progression (e.g., worsening pain, reduced mobility, increased frequency)
                to strengthen approval likelihood.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onAutoAddToJustification}
                disabled={!canAutoAddToJustification}
              >
                Auto-add to justification
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-1.5">Approval improvement note (optional):</p>
            <Textarea
              value={overrideNote}
              onChange={(e) => onOverrideChange(e.target.value)}
              placeholder="Document what evidence should be emphasized or added..."
              className="min-h-[60px] text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
