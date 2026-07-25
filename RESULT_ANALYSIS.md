# Result Analysis module (Phase 5 — Dev B)

Faculty enter, per section + component, the total strength, absentees, and the
count of students in each of the six mark ranges. The app derives failures and
pass %, and generates the department "RESULT ANALYSIS" report — as an XLSX (with
a native, editable bar chart) and a PDF — per section and consolidated across all
sections.

Built to match the supervisor's `RA.xlsx` template exactly (verified against the
FT3 / FT4 / LLT1 sample: e.g. LLT1 → pass 95.16%).

## 1. Enable it (one-time)

Run the migration in the Supabase SQL Editor:

```
supabase/result_analysis_migration.sql
```

(It's also in `supabase/schema.sql` for fresh setups.) It creates the
`result_analysis` table. Nothing else is required — no new npm packages
(uses the ExcelJS + pdf-lib already in the project).

## 2. How faculty use it

On the Faculty dashboard, each assigned course/section card now has a
**Result Analysis** button. In the modal they:

1. Pick the component (CT1, FT3, etc. — from the components the coordinator defined).
2. Enter Total Strength (pre-filled from the section's student count), Absentees,
   and the six range counts.
3. See live Failures, Pass %, and a **counted / present** balance check.
4. **Save**, then download **Section XLSX**, **Section PDF**, or **Consolidated PDF**.

Save is blocked until the six counts add up to present students
(strength − absentees), so the numbers can't be internally inconsistent.

## 3. Calculation rules (from the template)

- Ranges: `0-49, 50-59, 60-69, 70-79, 80-89, 90-100`.
- **Total Failures** = count in `0-49`.
- **Pass %** = (Strength − Failures) / Strength × 100.
- **Pass Mark** = 50% (fixed threshold).
- **Consolidated** = sum of every section's strength/absentees/range counts.

## 4. Files added

| File | Purpose |
| --- | --- |
| `src/lib/result-analysis.ts` | Pure generator: XLSX (template layout) + PDF (with bar chart), plus `computeDerived`, `validateInput`, `consolidate`. |
| `src/lib/result-analysis-data.ts` | Server-only DB access: load/save figures, assemble section & consolidated inputs. |
| `src/app/faculty/result-analysis-actions.ts` | Client-callable server actions: get/save + component list. |
| `src/app/api/result-analysis/route.ts` | POST → returns the XLSX/PDF as a download. |
| `src/app/faculty/ResultAnalysisModal.tsx` | The faculty entry + download UI. |
| `supabase/result_analysis_migration.sql` | The DB migration. |

Wired into `src/app/faculty/page.tsx` (the Result Analysis button per section).

## 5. Charts

- **XLSX:** every sheet has a **native, editable Excel bar chart** bound to its
  range table (`H11:H16` / `I11:I16`). ExcelJS can't author charts, so
  `src/lib/xlsx-chart.ts` injects the OOXML chart parts into the workbook with
  JSZip (already a dependency — no new packages). Verified rendering in
  LibreOffice and readable by openpyxl.
- **PDF:** the same chart is drawn with pdf-lib, per section + consolidated.

## 6. Notes for the next pass

- **Header fields:** `Dept` defaults to `CTECH` and `Year/Section` uses the
  section name, because the schema has no per-faculty department or study-year
  field. Add those columns later to populate the header precisely.
- **Range buckets:** the template uses 6 ranges (above). Sir verbally mentioned
  7 (`<49 … 91-100`) — the template wins; worth a one-line confirmation.
- Consolidated report includes only sections that have saved figures.

## 7. Quick self-test

`computeDerived`/generators are pure and were verified against the real template.
To regenerate samples locally:

```ts
import { generateResultAnalysisPdf, generateResultAnalysisXlsx } from "@/lib/result-analysis";
```

with the FT3/FT4/LLT1 numbers reproduces sir's sheet (pass % 100 / 98.39 / 95.16).
