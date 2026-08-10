"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";

export function RaDownloadButtons({
  offeringId,
  componentId,
  courseCode,
  component,
}: {
  offeringId: string;
  componentId: string;
  courseCode: string;
  component: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function download(scope: "register" | "consolidated", format: "xlsx" | "pdf") {
    setBusy(`${scope}-${format}`);
    setError(null);
    try {
      const res = await fetch("/api/result-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, format, component_id: componentId, offering_id: offeringId }),
      });
      if (!res.ok) {
        let msg = "Download failed.";
        try {
          const d = await res.json();
          if (d?.error) msg = d.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().split("T")[0];
      a.download = `${courseCode}_${component}_${scope}_${stamp}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => download("register", "xlsx")}
        disabled={!!busy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
      >
        {busy === "register-xlsx" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
        Register XLSX
      </button>
      <button
        onClick={() => download("consolidated", "pdf")}
        disabled={!!busy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
      >
        {busy === "consolidated-pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        Consolidated PDF
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
