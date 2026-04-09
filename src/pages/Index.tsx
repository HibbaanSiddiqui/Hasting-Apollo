import { useState, useCallback, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { NoteInput } from "@/components/NoteInput";
import { ExtractedInfoCard } from "@/components/ExtractedInfoCard";
import { RuleMatchPanel } from "@/components/RuleMatchPanel";
import { JustificationPreview } from "@/components/JustificationPreview";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { extractMedicalInfo, generateJustification } from "@/lib/ai";
import { matchRules } from "@/lib/insurance-rules";
import { loadSubmissions, addSubmission, updateSubmission } from "@/lib/storage";
import { Submission, ExtractedInfo } from "@/lib/types";
import { buildApprovalImprovementPlan } from "@/lib/approval";

type WorkflowStep = "input" | "extracted" | "justification";
const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Unexpected error");

export default function Index() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [step, setStep] = useState<WorkflowStep>("input");
  const [noteText, setNoteText] = useState("");
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo | null>(null);
  const [ruleMatch, setRuleMatch] = useState<{
    ruleName: string | null;
    metCriteria: string[];
    missingCriteria: string[];
    overrideNote: string;
  } | null>(null);
  const [justification, setJustification] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setSubmissions(loadSubmissions());
  }, []);

  const resetWorkflow = useCallback(() => {
    setActiveId(null);
    setStep("input");
    setNoteText("");
    setExtractedInfo(null);
    setRuleMatch(null);
    setJustification(null);
  }, []);

  const handleSelectSubmission = useCallback((id: string) => {
    const sub = submissions.find((s) => s.id === id);
    if (!sub) return;
    setActiveId(id);
    setNoteText(sub.noteText);
    setExtractedInfo(sub.extractedInfo);
    setRuleMatch(sub.ruleMatch);
    setJustification(sub.justification);
    setStep(sub.justification ? "justification" : sub.extractedInfo ? "extracted" : "input");
  }, [submissions]);

  const handleAnalyze = useCallback(async (text: string) => {
    setNoteText(text);
    setIsExtracting(true);
    try {
      const info = await extractMedicalInfo(text);
      setExtractedInfo(info);

      const match = matchRules(info.requestedTreatment, info.clinicalHistory);
      const matchState = {
        ruleName: match.matchedRule?.name || null,
        metCriteria: match.metCriteria,
        missingCriteria: match.missingCriteria,
        overrideNote: "",
      };
      setRuleMatch(matchState);

      const newSub: Submission = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        patientName: info.patientName,
        status: "draft",
        noteText: text,
        extractedInfo: info,
        justification: null,
        ruleMatch: matchState,
      };
      setActiveId(newSub.id);
      setSubmissions(addSubmission(newSub));
      setStep("extracted");
    } catch (error: unknown) {
      toast({ title: "Analysis failed", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const handleGenerate = useCallback(async (
    mode: "initial" | "optimized" | "appeal" = "initial",
    customRuleMatch?: NonNullable<typeof ruleMatch>
  ) => {
    const effectiveRuleMatch = customRuleMatch ?? ruleMatch;
    if (!extractedInfo || !effectiveRuleMatch) return;
    setIsGenerating(true);
    try {
      const letter = await generateJustification({
        extractedInfo,
        ruleName: effectiveRuleMatch.ruleName,
        metCriteria: effectiveRuleMatch.metCriteria,
        missingCriteria: effectiveRuleMatch.missingCriteria,
        overrideNote: effectiveRuleMatch.overrideNote,
        generationMode: mode,
      });
      setJustification(letter);
      setStep("justification");
      if (activeId) {
        setSubmissions(updateSubmission(activeId, { justification: letter, extractedInfo, ruleMatch: effectiveRuleMatch }));
      }
    } catch (error: unknown) {
      toast({ title: "Generation failed", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }, [extractedInfo, ruleMatch, activeId]);

  const handleImproveApproval = useCallback(async () => {
    if (!ruleMatch) return;
    const optimizationNote = buildApprovalImprovementPlan(ruleMatch.missingCriteria, noteText);
    const mergedNote = [ruleMatch.overrideNote, optimizationNote].filter(Boolean).join("\n\n");
    const nextRuleMatch = { ...ruleMatch, overrideNote: mergedNote };
    setRuleMatch(nextRuleMatch);
    if (activeId) {
      setSubmissions(updateSubmission(activeId, { ruleMatch: nextRuleMatch }));
    }
    await handleGenerate("optimized", nextRuleMatch);
  }, [ruleMatch, activeId, handleGenerate]);

  const handleMarkReviewed = useCallback(() => {
    if (!activeId) return;
    setSubmissions(updateSubmission(activeId, { status: "reviewed" }));
    toast({ title: "Marked as reviewed" });
  }, [activeId]);

  const handleAutoAddToJustification = useCallback(() => {
    if (!justification) return;
    const addition =
      "The patient reports progressive worsening of symptoms over the past 8 weeks, with increasing pain severity and functional limitation despite adherence to conservative therapy.";
    if (justification.includes(addition)) return;
    const nextText = `${justification}\n\n${addition}`;
    setJustification(nextText);
    if (activeId) {
      setSubmissions(updateSubmission(activeId, { justification: nextText }));
    }
    toast({ title: "Added improvement to justification" });
  }, [justification, activeId]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar
          submissions={submissions}
          activeId={activeId}
          onSelect={handleSelectSubmission}
          onNew={resetWorkflow}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <DisclaimerBanner />
          <header className="h-14 border-b flex items-center px-4 gap-3 shrink-0">
            <SidebarTrigger />
            <h1 className="font-heading font-semibold text-base">
              {step === "input" ? "New Hasting Apollo Request" : extractedInfo?.patientName || "Hasting Apollo"}
            </h1>
            {activeId && justification && (
              <Button variant="outline" size="sm" className="ml-auto" onClick={handleMarkReviewed}>
                Mark Reviewed
              </Button>
            )}
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {step === "input" && (
                <NoteInput onAnalyze={handleAnalyze} isLoading={isExtracting} />
              )}

              {step === "extracted" && extractedInfo && ruleMatch && (
                <>
                  <ExtractedInfoCard info={extractedInfo} onChange={setExtractedInfo} />
                  <RuleMatchPanel
                    ruleName={ruleMatch.ruleName}
                    metCriteria={ruleMatch.metCriteria}
                    missingCriteria={ruleMatch.missingCriteria}
                    overrideNote={ruleMatch.overrideNote}
                    noteText={noteText}
                    isImproving={isGenerating}
                    onImproveApproval={handleImproveApproval}
                    onAutoAddToJustification={handleAutoAddToJustification}
                    canAutoAddToJustification={Boolean(justification)}
                    onOverrideChange={(note) => setRuleMatch({ ...ruleMatch, overrideNote: note })}
                  />
                  <Button onClick={() => handleGenerate()} disabled={isGenerating} className="w-full" size="lg">
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating Justification…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Justification
                      </>
                    )}
                  </Button>
                </>
              )}

              {step === "justification" && justification && (
                <>
                  {extractedInfo && <ExtractedInfoCard info={extractedInfo} onChange={setExtractedInfo} />}
                  {ruleMatch && (
                    <RuleMatchPanel
                      ruleName={ruleMatch.ruleName}
                      metCriteria={ruleMatch.metCriteria}
                      missingCriteria={ruleMatch.missingCriteria}
                      overrideNote={ruleMatch.overrideNote}
                      noteText={noteText}
                      isImproving={isGenerating}
                      onImproveApproval={handleImproveApproval}
                      onAutoAddToJustification={handleAutoAddToJustification}
                      canAutoAddToJustification={Boolean(justification)}
                      onOverrideChange={(note) => setRuleMatch({ ...ruleMatch, overrideNote: note })}
                    />
                  )}
                  <JustificationPreview
                    justification={justification}
                    onChange={(text) => {
                      setJustification(text);
                      if (activeId) updateSubmission(activeId, { justification: text });
                    }}
                    onGenerateAppeal={() => handleGenerate("appeal")}
                    isGeneratingAppeal={isGenerating}
                  />
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
