import { useState, useCallback } from "react";
import { FileText, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { extractTextFromPdf } from "@/lib/pdf-parser";
import { toast } from "@/hooks/use-toast";

interface NoteInputProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
}

export function NoteInput({ onAnalyze, isLoading }: NoteInputProps) {
  const [mode, setMode] = useState<"text" | "pdf">("text");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleFileDrop = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    setIsParsing(true);
    setFileName(file.name);
    try {
      const extracted = await extractTextFromPdf(file);
      setText(extracted);
      toast({ title: "PDF parsed", description: `Extracted text from ${file.name}` });
    } catch (e) {
      toast({ title: "Parse error", description: "Could not read PDF. Try pasting text instead.", variant: "destructive" });
    } finally {
      setIsParsing(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileDrop(file);
  }, [handleFileDrop]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileDrop(file);
  }, [handleFileDrop]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-heading font-semibold">Doctor's Note</h2>
        <div className="flex bg-secondary rounded-lg p-0.5 ml-auto">
          <button
            onClick={() => setMode("text")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${mode === "text" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            <FileText className="h-3.5 w-3.5 inline mr-1.5" />
            Paste Text
          </button>
          <button
            onClick={() => setMode("pdf")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${mode === "pdf" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Upload className="h-3.5 w-3.5 inline mr-1.5" />
            Upload PDF
          </button>
        </div>
      </div>

      {mode === "pdf" && !text && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/40 transition-colors cursor-pointer"
          onClick={() => document.getElementById("pdf-input")?.click()}
        >
          {isParsing ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Parsing {fileName}…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-8 w-8" />
              <p>Drop a PDF here or click to browse</p>
              <p className="text-xs">Parsed client-side — nothing leaves your browser</p>
            </div>
          )}
          <input id="pdf-input" type="file" accept=".pdf" className="hidden" onChange={onFileSelect} />
        </div>
      )}

      {(mode === "text" || text) && (
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the doctor's note here…&#10;&#10;Example: Patient John Doe, 45M, presents with chronic lower back pain radiating to left leg for 8 weeks. Failed conservative treatment including NSAIDs and 6 weeks of physical therapy. MRI of lumbar spine recommended to evaluate for disc herniation…"
          className="min-h-[200px] font-body text-sm leading-relaxed resize-y"
        />
      )}

      {fileName && text && (
        <p className="text-xs text-muted-foreground">📄 Extracted from: {fileName}</p>
      )}

      <Button
        onClick={() => onAnalyze(text)}
        disabled={!text.trim() || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Analyzing with AI…
          </>
        ) : (
          "Analyze Note"
        )}
      </Button>
    </div>
  );
}
