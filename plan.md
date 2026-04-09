
# Hasting Apollo MVP — Prior Authorization Automation

## What We're Building
A dashboard-style tool where front desk staff can paste or upload a doctor's note, and an AI extracts medical info, checks it against a simple insurance rule, and generates a medical necessity justification letter — ready for human review and copy/paste submission.

## Design Direction
- **Palette**: Warm, minimal — off-white backgrounds (#faf8f5), subtle warm grays, indigo accent (#6366f1) for actions/AI elements. Not overly clinical — feels like a smart teammate.
- **Typography**: Clean sans-serif (Inter body, Space Grotesk headings) — readable, modern.
- **Layout**: Dashboard with a collapsible sidebar (submission history), main content area as the workspace.
- **Tone**: AI outputs styled conversationally — not cold clinical blocks. Safety warnings and review prompts built in.

## Pages & Components

### 1. Dashboard Layout
- **Sidebar**: List of past submissions (stored in-memory or localStorage for MVP). Each shows patient name + date + status badge (Draft/Reviewed).
- **Header**: App name "Hasting Apollo", collapse trigger, simple "New Request" button.

### 2. Main Workspace (New Request)
- **Step 1 — Input Panel**: 
  - Toggle between "Paste Text" (textarea) and "Upload PDF" (drag-and-drop file upload)
  - PDF gets parsed client-side into text (using pdf.js)
  - "Analyze" button to submit
  
- **Step 2 — Extracted Info Card**:
  - AI extracts and displays: Patient Name, Diagnosis (ICD codes if found), Requested Treatment, Clinical History Summary
  - Each field is editable — staff can correct before generating justification
  - Safety badge: "⚠️ AI-extracted — please verify before proceeding"

- **Step 3 — Insurance Rule Match**:
  - Hardcoded simple rules (e.g., "MRI requires failed conservative treatment for 6+ weeks")
  - Shows: Rule matched ✅ or ⚠️ Missing criteria with what's needed
  - Staff can override with a note

- **Step 4 — Generated Justification**:
  - AI-generated medical necessity letter in a rich text preview
  - "Copy to Clipboard" button
  - "Edit" mode to tweak before copying
  - Timestamp + "Draft — Not Submitted" watermark

### 3. History View (Sidebar)
- Click any past submission to re-view the extracted data + generated letter
- Stored in localStorage (no database for MVP)

## Tech Approach

### Stack
- **Frontend**: React + Tailwind + shadcn/ui (already set up)
- **PDF Parsing**: pdf.js (pdfjs-dist) — client-side, no server needed
- **AI**: Lovable AI Gateway (Gemini) via edge function — extracts medical info + generates justification
- **Storage**: localStorage for submission history (no database needed for MVP)
- **Rule Engine**: Hardcoded JSON rules checked client-side

### AI Edge Functions
1. **`extract-medical-info`** — Takes doctor note text, returns structured JSON (patient name, diagnosis, treatment, history)
2. **`generate-justification`** — Takes extracted info + matched rule, returns a medical necessity letter

### Shortcuts & What to Fake
- **No auth** — open access, single user assumed
- **No database** — localStorage only
- **Hardcoded insurance rules** — 3-5 simple rules in a JSON file
- **No real submission** — just "Copy to Clipboard"
- **No HIPAA compliance** — disclaimer banner at top
- **PDF parsing client-side** — no server processing needed

## User Flow
1. Staff clicks "New Request"
2. Pastes doctor note OR uploads PDF
3. Clicks "Analyze" → AI extracts medical info (loading state with streaming feel)
4. Reviews/edits extracted fields
5. System auto-matches insurance rule → shows match status
6. Clicks "Generate Justification" → AI writes the letter
7. Reviews letter → copies to clipboard → done
8. Submission saved to sidebar history

## Components to Build
1. `AppSidebar` — history list + new request button
2. `DashboardLayout` — sidebar + main content with header
3. `NoteInput` — text/PDF toggle input with drag-drop
4. `ExtractedInfoCard` — editable AI-extracted fields with safety warning
5. `RuleMatchPanel` — shows matched rule + status
6. `JustificationPreview` — generated letter with copy/edit
7. `DisclaimerBanner` — "Not HIPAA compliant, for demo purposes" top banner
8. Edge functions for AI extraction and generation
