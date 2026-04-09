import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ExtractedInfo } from "@/lib/types";

interface ExtractedInfoCardProps {
  info: ExtractedInfo;
  onChange: (info: ExtractedInfo) => void;
}

export function ExtractedInfoCard({ info, onChange }: ExtractedInfoCardProps) {
  const update = (field: keyof ExtractedInfo, value: string) => {
    onChange({ ...info, [field]: value });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading">Extracted Medical Info</CardTitle>
          <Badge variant="outline" className="gap-1 text-warning border-warning/30 bg-warning/5">
            <AlertTriangle className="h-3 w-3" />
            AI-extracted — verify
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Patient Name</Label>
            <Input value={info.patientName} onChange={(e) => update("patientName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">ICD Codes</Label>
            <Input value={info.icdCodes} onChange={(e) => update("icdCodes", e.target.value)} placeholder="e.g., M54.5" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Diagnosis</Label>
          <Input value={info.diagnosis} onChange={(e) => update("diagnosis", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Requested Treatment</Label>
          <Input value={info.requestedTreatment} onChange={(e) => update("requestedTreatment", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Clinical History Summary</Label>
          <Textarea
            value={info.clinicalHistory}
            onChange={(e) => update("clinicalHistory", e.target.value)}
            className="min-h-[80px] text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
