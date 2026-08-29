import ExcelJS from "exceljs";

export type ExcelColumn = {
  /** Column header label shown in the sheet. */
  header: string;
  /** Key used to read the value from each row object. */
  key: string;
  /** Optional fixed column width (Excel units). Auto-sized if omitted. */
  width?: number;
};

export type ExcelPayload = {
  /** Sheet/report title (printed as a banner on the first rows). */
  title: string;
  /** Optional sub-heading printed under the title. */
  subtitle?: string;
  /** Worksheet/tab name. */
  sheetName?: string;
  columns: ExcelColumn[];
  rows: Record<string, unknown>[];
  /** Print orientation; defaults to landscape for wide tables. */
  orientation?: "portrait" | "landscape";
};

const BRAND = "FF15519E"; // SRM / DocVault accent
const BRAND_SOFT = "FFEAF1FA";
const INK = "FF1C2D45";

/**
 * Builds a polished, print-ready .xlsx workbook from tabular data.
 * Includes a branded title banner, styled header row, zebra striping,
 * borders, frozen header, auto column widths and full print page-setup
 * (so the user can open the file and press Ctrl/Cmd+P for a clean printout).
 */
export async function buildXlsxBuffer(payload: ExcelPayload): Promise<Buffer> {
  const {
    title,
    subtitle,
    sheetName = "Report",
    columns,
    rows,
    orientation = "landscape",
  } = payload;

  const wb = new ExcelJS.Workbook();
  wb.creator = "DocVault — SRM Academic Portal";
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName.slice(0, 31), {
    pageSetup: {
      orientation,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.6,
        bottom: 0.6,
        header: 0.3,
        footer: 0.3,
      },
    },
    headerFooter: {
      oddFooter: "&LDocVault · SRM Academic Portal&RPage &P of &N",
      oddHeader: `&L&"-,Bold"${title.replace(/&/g, "&&")}`,
    },
  });

  const colCount = columns.length;
  const lastCol = ws.getColumn(colCount).letter;

  // --- Title banner ---
  ws.mergeCells(`A1:${lastCol}1`);
  const titleCell = ws.getCell("A1");
  titleCell.value = title;
  titleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
  ws.getRow(1).height = 30;

  let cursor = 2;
  if (subtitle) {
    ws.mergeCells(`A2:${lastCol}2`);
    const sub = ws.getCell("A2");
    sub.value = subtitle;
    sub.font = { name: "Calibri", size: 10, color: { argb: "FFFFFFFF" } };
    sub.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    sub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
    ws.getRow(2).height = 18;
    cursor = 3;
  }

  // --- Meta line (generated timestamp + record count) ---
  ws.mergeCells(`A${cursor}:${lastCol}${cursor}`);
  const meta = ws.getCell(`A${cursor}`);
  meta.value = `Generated ${new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })}  ·  ${rows.length} record${rows.length === 1 ? "" : "s"}`;
  meta.font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF5E6B7F" } };
  meta.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  const metaRow = cursor;
  cursor += 2; // blank spacer row before the table

  // --- Header row ---
  const headerRowNum = cursor;
  const headerRow = ws.getRow(headerRowNum);
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: BRAND } },
      bottom: { style: "thin", color: { argb: BRAND } },
      left: { style: "thin", color: { argb: "FFFFFFFF" } },
      right: { style: "thin", color: { argb: "FFFFFFFF" } },
    };
  });
  headerRow.height = 22;

  // --- Data rows ---
  rows.forEach((row, r) => {
    const excelRow = ws.getRow(headerRowNum + 1 + r);
    columns.forEach((col, i) => {
      const raw = row[col.key];
      const cell = excelRow.getCell(i + 1);
      cell.value = (raw ?? "") as ExcelJS.CellValue;
      cell.font = { name: "Calibri", size: 10, color: { argb: INK } };
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      if (r % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_SOFT } };
      }
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFD8E0EC" } },
      };
    });
  });

  // --- Column widths (auto, capped) ---
  columns.forEach((col, i) => {
    if (col.width) {
      ws.getColumn(i + 1).width = col.width;
      return;
    }
    let max = col.header.length;
    rows.forEach((row) => {
      const v = row[col.key];
      const len = v == null ? 0 : String(v).length;
      if (len > max) max = len;
    });
    ws.getColumn(i + 1).width = Math.min(Math.max(max + 3, 12), 48);
  });

  // Freeze everything above and including the header row, so it repeats on screen
  ws.views = [{ state: "frozen", ySplit: headerRowNum }];
  // Repeat the header row on every printed page
  ws.pageSetup.printTitlesRow = `${headerRowNum}:${headerRowNum}`;
  void metaRow;

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}
