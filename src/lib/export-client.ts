"use client";

export type ExportColumn = { header: string; key: string; width?: number };

export type ExportRequest = {
  filename: string;
  title: string;
  subtitle?: string;
  sheetName?: string;
  orientation?: "portrait" | "landscape";
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
};

/**
 * Posts tabular data to the server, which returns a print-ready .xlsx file,
 * then triggers a browser download. Throws on failure so callers can surface
 * an error state.
 */
export async function exportToExcel(req: ExportRequest): Promise<void> {
  const res = await fetch("/api/export/xlsx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    let msg = "Export failed.";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().split("T")[0];
  const link = document.createElement("a");
  link.href = url;
  link.download = `${req.filename}_${stamp}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
