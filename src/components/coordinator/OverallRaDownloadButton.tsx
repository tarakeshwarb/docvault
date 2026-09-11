"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";

export function OverallRaDownloadButton({
  offeringId,
  componentId,
  courseCode,
  componentName,
}: {
  offeringId: string;
  componentId: string;
  courseCode: string;
  componentName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/result-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "overall",
          format: "xlsx",
          component_id: componentId,
          offering_id: offeringId,
        }),
      });
      if (!res.ok) {
        let msg = "Download failed.";
        try {
          const d = await res.json();
          if (d?.error) msg = d.error;
        } catch {}
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().split("T")[0];
      a.download = `${courseCode}_${componentName}_Overall_RA_${stamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5" />
        )}
        Overall Analysis XLSX
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
