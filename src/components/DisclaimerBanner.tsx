import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

export function DisclaimerBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="bg-warning/10 border-b border-warning/20 px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-foreground/80">
        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
        <span>
          <strong>Demo only</strong> — Not HIPAA-compliant. Do not use with real patient data.
        </span>
      </div>
      <button onClick={() => setVisible(false)} className="text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
