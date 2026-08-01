/**
 * Result Analysis generator.
 *
 * Reproduces the department "RESULT ANALYSIS" template (see RA.xlsx from the
 * supervisor): a per-section/component sheet with a header block, summary
 * fields, a range-of-marks table, and a bar chart, plus a consolidated view.
 *
 * Faculty enter: total strength, total absentees, and the count of students in
 * each of the six mark ranges. Everything else is derived here so the numbers
 * always match the template's formulas.
 *
 * Output:
 *   - XLSX: one worksheet per input, matching the template layout (data + table).
 *   - PDF : one page per input, including the bar chart drawn with pdf-lib.
 *           (ExcelJS cannot author native Excel charts, so the graph — which the
 *            supervisor asked to be produced "as a single PDF" — lives in the PDF.)
 */
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { injectBarCharts, type ChartSpec } from "./xlsx-chart";

export const INSTITUTION = "SRM Institute of Science and Technology";
export const COLLEGE = "COLLEGE OF ENGINEERING AND TECHNOLOGY, SCHOOL OF COMPUTING";
export const PASS_MARK_PERCENT = 50;

/** The six mark-range buckets, in the template's order. */
export const RANGE_LABELS = ["0-49", "50-59", "60-69", "70-79", "80-89", "90-100"] as const;
export const RANGE_COUNT = RANGE_LABELS.length;

export type ResultAnalysisInput = {
  courseCode: string;
  courseName: string;
  component: string; // e.g. "FT3", "CT1", "Consolidated"
  academicYear: string; // e.g. "2025-2026 EVEN"
  staffName: string;
  dept: string;
  specialization?: string;
  yearSection: string; // e.g. "II / F1" (blank for consolidated)
  semester: string; // e.g. "IV"
  totalStrength: number;
  totalAbsentees: number;
  /** counts per RANGE_LABELS, length 6 */
  ranges: number[];
};

export type ResultAnalysisDerived = {
  totalFailures: number;
  passMarkPercent: number;
  passPercentage: number; // 0..100
  totalPresent: number;
  sumRanges: number;
};

/** Derive failures / pass % exactly like the template's formulas. */
export function computeDerived(input: ResultAnalysisInput): ResultAnalysisDerived {
  const ranges = normalizeRanges(input.ranges);
  const totalFailures = ranges[0]; // students in 0-49 are the failures
  const strength = Math.max(0, input.totalStrength);
  const passPercentage =
    strength > 0 ? ((strength - totalFailures) / strength) * 100 : 0;
  return {
    totalFailures,
    passMarkPercent: PASS_MARK_PERCENT,
    passPercentage,
    totalPresent: strength - Math.max(0, input.totalAbsentees),
    sumRanges: ranges.reduce((a, b) => a + b, 0),
  };
}

/** Return human-readable validation problems (empty array => valid). */
export function validateInput(input: ResultAnalysisInput): string[] {
  const errors: string[] = [];
  const ranges = normalizeRanges(input.ranges);
  if (input.totalStrength < 0) errors.push("Total strength cannot be negative.");
  if (input.totalAbsentees < 0) errors.push("Total absentees cannot be negative.");
  if (ranges.some((n) => n < 0)) errors.push("Range counts cannot be negative.");
  const present = input.totalStrength - input.totalAbsentees;
  const sum = ranges.reduce((a, b) => a + b, 0);
  if (sum !== present) {
    errors.push(
      `The six range counts add up to ${sum}, but present students (strength ${input.totalStrength} − absentees ${input.totalAbsentees}) = ${present}. They must match.`
    );
  }
  return errors;
}

function normalizeRanges(ranges: number[]): number[] {
  const out = new Array(RANGE_COUNT).fill(0);
  for (let i = 0; i < RANGE_COUNT; i++) out[i] = Math.max(0, Math.floor(Number(ranges?.[i] ?? 0)));
  return out;
}

/** Sum a set of section inputs into one consolidated input for an offering+component. */
export function consolidate(
  inputs: ResultAnalysisInput[],
  header: Pick<ResultAnalysisInput, "courseCode" | "courseName" | "component" | "academicYear" | "dept" | "semester">
): ResultAnalysisInput {
  const ranges = new Array(RANGE_COUNT).fill(0);
  let strength = 0;
  let absentees = 0;
  for (const it of inputs) {
    const r = normalizeRanges(it.ranges);
    for (let i = 0; i < RANGE_COUNT; i++) ranges[i] += r[i];
    strength += it.totalStrength;
    absentees += it.totalAbsentees;
  }
  return {
    ...header,
    staffName: "All Sections (Consolidated)",
    specialization: "-",
    yearSection: "All",
    totalStrength: strength,
    totalAbsentees: absentees,
    ranges,
  };
}

// ---------------------------------------------------------------------------
// XLSX
// ---------------------------------------------------------------------------

const THIN = { style: "thin" as const, color: { argb: "FF000000" } };
const BORDER_ALL = { top: THIN, left: THIN, bottom: THIN, right: THIN };

function safeSheetName(name: string): string {
  // Excel sheet names: <=31 chars, no : \ / ? * [ ]
  return (name.replace(/[:\\/?*\[\]]/g, "-").slice(0, 31)) || "Sheet";
}

function addWorksheet(wb: ExcelJS.Workbook, input: ResultAnalysisInput) {
  const d = computeDerived(input);
  const ranges = normalizeRanges(input.ranges);
  const ws = wb.addWorksheet(safeSheetName(input.component), {
    views: [{ showGridLines: false }],
  });

  ws.columns = [
    { width: 14 }, { width: 14 }, { width: 12 }, { width: 12 }, { width: 4 },
    { width: 6 }, { width: 6 }, { width: 12 }, { width: 10 }, { width: 10 }, { width: 4 },
  ];

  const center = { horizontal: "center" as const, vertical: "middle" as const };

  const titleRow = (row: number, text: string, size: number, bold = true) => {
    ws.mergeCells(`A${row}:K${row}`);
    const c = ws.getCell(`A${row}`);
    c.value = text;
    c.font = { bold, size };
    c.alignment = center;
  };
  titleRow(1, INSTITUTION, 12);
  titleRow(2, COLLEGE, 10);
  titleRow(3, `${input.courseCode} - ${input.courseName}`, 11);
  titleRow(4, `RESULT ANALYSIS, ${input.component}`, 11);
  titleRow(5, `Academic Year ${input.academicYear}`, 10);

  ws.getCell("B6").value = `Name : ${input.staffName}`;
  ws.getCell("B6").font = { bold: true };
  ws.getCell("B7").value = `Dept: ${input.dept}`;
  ws.getCell("B7").font = { bold: true };
  ws.getCell("B8").value = `Specialization: ${input.specialization ?? "-"}`;
  ws.getCell("B8").font = { bold: true };
  ws.getCell("H7").value = "Year/Section";
  ws.getCell("H7").font = { bold: true };
  ws.getCell("I7").value = input.yearSection;
  ws.getCell("H8").value = "Sem";
  ws.getCell("H8").font = { bold: true };
  ws.getCell("I8").value = input.semester;

  // Summary table (left) — labels B..C merged, value in D
  const summary: Array<[string, string | number, string?]> = [
    ["Total Strength", input.totalStrength],
    ["Total Absentees", input.totalAbsentees],
    ["Total No of Failures", d.totalFailures],
    ["Pass Mark", d.passMarkPercent / 100, "0%"],
    ["Pass Percentage", d.passPercentage / 100, "0.00%"],
  ];
  summary.forEach(([label, value, fmt], i) => {
    const r = 10 + i;
    ws.mergeCells(`B${r}:C${r}`);
    const lc = ws.getCell(`B${r}`);
    lc.value = label;
    lc.font = { bold: true };
    lc.alignment = { horizontal: "center", vertical: "middle" };
    lc.border = BORDER_ALL;
    ws.getCell(`C${r}`).border = BORDER_ALL;
    const vc = ws.getCell(`D${r}`);
    vc.value = value;
    vc.alignment = center;
    vc.border = BORDER_ALL;
    if (fmt) vc.numFmt = fmt;
  });

  // Range-of-marks table (right): H10 header "Range of Marks", I10 "Total"
  const hHead = ws.getCell("H10");
  hHead.value = "Range of Marks";
  hHead.font = { bold: true };
  hHead.alignment = center;
  hHead.border = BORDER_ALL;
  const iHead = ws.getCell("I10");
  iHead.value = "Total";
  iHead.font = { bold: true };
  iHead.alignment = center;
  iHead.border = BORDER_ALL;
  RANGE_LABELS.forEach((label, i) => {
    const r = 11 + i;
    const hc = ws.getCell(`H${r}`);
    hc.value = label;
    hc.alignment = center;
    hc.border = BORDER_ALL;
    const ic = ws.getCell(`I${r}`);
    ic.value = ranges[i];
    ic.alignment = center;
    ic.border = BORDER_ALL;
  });

  ws.getCell("D16").value = "Total vs. Range of Marks";
  ws.getCell("D16").font = { italic: true };
  // A native bar chart is injected below this area by injectBarCharts().

  ws.getCell("H40").value = "Signature of Staff In Charge";
  ws.getCell("H40").font = { bold: true };
}

export async function generateResultAnalysisXlsx(
  inputs: ResultAnalysisInput[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "CourseFlow / DocVault";
  wb.created = new Date();
  const specs: ChartSpec[] = [];
  inputs.forEach((input, i) => {
    addWorksheet(wb, input);
    specs.push({ sheetIndex: i + 1, sheetName: safeSheetName(input.component) });
  });
  const arr = await wb.xlsx.writeBuffer();
  // Add a native Excel bar chart to each sheet (ExcelJS can't author charts).
  return injectBarCharts(Buffer.from(arr), specs);
}

// ---------------------------------------------------------------------------
// XLSX — consolidated register (matches the SoC "Result Analysis" register:
// one sheet listing every section as a row, with a totals row + bar chart)
// ---------------------------------------------------------------------------

export type RegisterHeader = {
  courseCode: string;
  courseName: string;
  component: string;
  academicYear: string;
  semester: string;
  maxMarks?: string;
  batch?: string;
};

const COL = (i: number) => String.fromCharCode(65 + i); // 0->A ... 11->L

export async function generateResultAnalysisRegisterXlsx(
  header: RegisterHeader,
  sections: ResultAnalysisInput[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "CourseFlow / DocVault";
  wb.created = new Date();
  const ws = wb.addWorksheet(safeSheetName(header.component), { views: [{ showGridLines: false }] });
  ws.columns = [
    { width: 6 }, { width: 26 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 },
    { width: 8 }, { width: 8 }, { width: 8 }, { width: 14 }, { width: 22 }, { width: 12 },
  ];
  const center = { horizontal: "center" as const, vertical: "middle" as const };
  const left = { horizontal: "left" as const, vertical: "middle" as const };

  const titleRow = (row: number, text: string, size: number) => {
    ws.mergeCells(`A${row}:L${row}`);
    const c = ws.getCell(`A${row}`);
    c.value = text;
    c.font = { bold: true, size };
    c.alignment = center;
  };
  titleRow(1, INSTITUTION, 12);
  titleRow(2, "FACULTY OF ENGINEERING AND TECHNOLOGY", 10);
  titleRow(3, "SCHOOL OF COMPUTING", 10);
  titleRow(4, `(ACADEMIC YEAR ${header.academicYear})`, 10);
  titleRow(5, `${header.semester} Semester - ${header.courseCode} - ${header.courseName} handled by SOC Faculty`, 10);
  titleRow(6, `${header.component} RESULT ANALYSIS${header.maxMarks ? ` :  ${header.maxMarks} Marks` : ""}`, 11);

  const grandStrength = sections.reduce((a, s) => a + (s.totalStrength || 0), 0);
  ws.getCell("A7").value = `Total Strength : ${grandStrength}`;
  ws.getCell("A7").font = { bold: true };
  if (header.batch) {
    ws.getCell("F7").value = `Batch : ${header.batch}`;
    ws.getCell("F7").font = { bold: true };
  }

  const headers = ["SNo", "Staff Name", "SEC", ...RANGE_LABELS, "Total Strength", "No. of students Attended", "Absentees"];
  headers.forEach((h, i) => {
    const c = ws.getCell(`${COL(i)}9`);
    c.value = h;
    c.font = { bold: true };
    c.alignment = center;
    c.border = BORDER_ALL;
  });

  let r = 10;
  const totals = new Array(RANGE_COUNT).fill(0);
  let tStrength = 0, tAttended = 0, tAbsent = 0;
  sections.forEach((s, idx) => {
    const ranges = normalizeRanges(s.ranges);
    const attended = Math.max(0, s.totalStrength - s.totalAbsentees);
    const rowVals: (string | number)[] = [idx + 1, s.staffName, s.yearSection, ...ranges, s.totalStrength, attended, s.totalAbsentees];
    rowVals.forEach((v, i) => {
      const c = ws.getCell(`${COL(i)}${r}`);
      c.value = v;
      c.alignment = i === 1 ? left : center;
      c.border = BORDER_ALL;
    });
    ranges.forEach((v, i) => (totals[i] += v));
    tStrength += s.totalStrength;
    tAttended += attended;
    tAbsent += s.totalAbsentees;
    r++;
  });

  const totalRow = r;
  const trVals: (string | number)[] = ["", "TOTAL", "", ...totals, tStrength, tAttended, tAbsent];
  trVals.forEach((v, i) => {
    const c = ws.getCell(`${COL(i)}${totalRow}`);
    c.value = v;
    c.font = { bold: true };
    c.alignment = i === 1 ? left : center;
    c.border = BORDER_ALL;
  });

  const arr = await wb.xlsx.writeBuffer();
  const spec: ChartSpec = {
    sheetIndex: 1,
    sheetName: safeSheetName(header.component),
    catRange: "$D$9:$I$9",
    valRange: `$D$${totalRow}:$I$${totalRow}`,
    titleCell: `$B$${totalRow}`,
    title: `${header.component} — Total vs. Range of Marks`,
    anchor: [1, totalRow + 1, 9, totalRow + 22],
  };
  return injectBarCharts(Buffer.from(arr), [spec]);
}

// ---------------------------------------------------------------------------
// PDF (with bar chart)
// ---------------------------------------------------------------------------

const INK: [number, number, number] = [0.12, 0.18, 0.28];
const ACCENT: [number, number, number] = [0.16, 0.44, 0.78];
const GRID: [number, number, number] = [0.8, 0.83, 0.88];

function drawBarChart(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  opts: { x: number; y: number; w: number; h: number; counts: number[]; labels: readonly string[] }
) {
  const { x, y, w, h, counts, labels } = opts;
  const maxVal = Math.max(1, ...counts);
  // "nice" axis max rounded up to a step
  const step = niceStep(maxVal);
  const axisMax = Math.ceil(maxVal / step) * step;
  const plotBottom = y;
  const plotTop = y + h;

  // gridlines + y labels
  for (let v = 0; v <= axisMax; v += step) {
    const gy = plotBottom + (h * v) / axisMax;
    page.drawLine({
      start: { x, y: gy },
      end: { x: x + w, y: gy },
      thickness: 0.5,
      color: rgb(...GRID),
    });
    page.drawText(String(v), {
      x: x - 22,
      y: gy - 3,
      size: 7,
      font,
      color: rgb(...INK),
    });
  }
  // axes
  page.drawLine({ start: { x, y: plotBottom }, end: { x: x + w, y: plotBottom }, thickness: 1, color: rgb(...INK) });
  page.drawLine({ start: { x, y: plotBottom }, end: { x, y: plotTop }, thickness: 1, color: rgb(...INK) });

  const n = counts.length;
  const slot = w / n;
  const barW = slot * 0.6;
  counts.forEach((c, i) => {
    const bh = axisMax > 0 ? (h * c) / axisMax : 0;
    const bx = x + i * slot + (slot - barW) / 2;
    if (bh > 0) {
      page.drawRectangle({ x: bx, y: plotBottom, width: barW, height: bh, color: rgb(...ACCENT) });
    }
    // value on top
    const vLabel = String(c);
    page.drawText(vLabel, {
      x: bx + barW / 2 - font.widthOfTextAtSize(vLabel, 7) / 2,
      y: plotBottom + bh + 3,
      size: 7,
      font: fontBold,
      color: rgb(...INK),
    });
    // x label
    const xl = labels[i];
    page.drawText(xl, {
      x: bx + barW / 2 - font.widthOfTextAtSize(xl, 7) / 2,
      y: plotBottom - 12,
      size: 7,
      font,
      color: rgb(...INK),
    });
  });

  // title
  const title = "Total vs. Range of Marks";
  page.drawText(title, {
    x: x + w / 2 - fontBold.widthOfTextAtSize(title, 10) / 2,
    y: plotTop + 14,
    size: 10,
    font: fontBold,
    color: rgb(...INK),
  });
}

function niceStep(maxVal: number): number {
  if (maxVal <= 5) return 1;
  if (maxVal <= 10) return 2;
  if (maxVal <= 30) return 5;
  if (maxVal <= 60) return 10;
  if (maxVal <= 150) return 25;
  if (maxVal <= 300) return 50;
  return Math.ceil(maxVal / 6 / 100) * 100;
}

function addPdfPage(pdf: PDFDocument, font: PDFFont, fontBold: PDFFont, input: ResultAnalysisInput) {
  const d = computeDerived(input);
  const ranges = normalizeRanges(input.ranges);
  const page = pdf.addPage([595, 842]); // A4 portrait
  const cx = 595 / 2;
  let y = 800;

  const centerText = (text: string, size: number, bold = false) => {
    const f = bold ? fontBold : font;
    page.drawText(text, { x: cx - f.widthOfTextAtSize(text, size) / 2, y, size, font: f, color: rgb(...INK) });
    y -= size + 5;
  };
  centerText(INSTITUTION, 13, true);
  centerText(COLLEGE, 9, true);
  centerText(`${input.courseCode} - ${input.courseName}`, 11, true);
  centerText(`RESULT ANALYSIS, ${input.component}`, 11, true);
  centerText(`Academic Year ${input.academicYear}`, 9);
  y -= 6;

  const left = 60;
  const rightColX = 330;
  const rowH = 18;
  const label = (x: number, yy: number, text: string, bold = true) =>
    page.drawText(text, { x, y: yy, size: 9, font: bold ? fontBold : font, color: rgb(...INK) });

  // staff block
  label(left, y, `Name : ${input.staffName}`);
  label(rightColX, y, `Year/Section : ${input.yearSection}`);
  y -= rowH;
  label(left, y, `Dept : ${input.dept}`);
  label(rightColX, y, `Sem : ${input.semester}`);
  y -= rowH;
  label(left, y, `Specialization : ${input.specialization ?? "-"}`);
  y -= rowH + 6;

  // summary table (left) and range table (right), drawn as simple bordered rows
  const summary: Array<[string, string]> = [
    ["Total Strength", String(input.totalStrength)],
    ["Total Absentees", String(input.totalAbsentees)],
    ["Total No of Failures", String(d.totalFailures)],
    ["Pass Mark", `${d.passMarkPercent}%`],
    ["Pass Percentage", `${d.passPercentage.toFixed(2)}%`],
  ];
  const sumTop = y;
  summary.forEach(([k, v], i) => {
    const ry = sumTop - i * rowH;
    page.drawRectangle({ x: left, y: ry - 4, width: 200, height: rowH, borderWidth: 0.5, borderColor: rgb(...GRID) });
    label(left + 4, ry + 2, k);
    page.drawText(v, { x: left + 150, y: ry + 2, size: 9, font, color: rgb(...INK) });
  });

  const rangeTop = y;
  page.drawRectangle({ x: rightColX, y: rangeTop - 4, width: 205, height: rowH, borderWidth: 0.5, borderColor: rgb(...GRID) });
  label(rightColX + 4, rangeTop + 2, "Range of Marks");
  page.drawText("Total", { x: rightColX + 150, y: rangeTop + 2, size: 9, font: fontBold, color: rgb(...INK) });
  RANGE_LABELS.forEach((lbl, i) => {
    const ry = rangeTop - (i + 1) * rowH;
    page.drawRectangle({ x: rightColX, y: ry - 4, width: 205, height: rowH, borderWidth: 0.5, borderColor: rgb(...GRID) });
    label(rightColX + 4, ry + 2, lbl, false);
    page.drawText(String(ranges[i]), { x: rightColX + 150, y: ry + 2, size: 9, font, color: rgb(...INK) });
  });

  // chart
  drawBarChart(page, font, fontBold, {
    x: 90,
    y: 210,
    w: 420,
    h: 230,
    counts: ranges,
    labels: RANGE_LABELS,
  });

  // signature
  page.drawText("Signature of Staff In Charge", {
    x: 360,
    y: 90,
    size: 9,
    font: fontBold,
    color: rgb(...INK),
  });
}

export async function generateResultAnalysisPdf(inputs: ResultAnalysisInput[]): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  for (const input of inputs) addPdfPage(pdf, font, fontBold, input);
  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
