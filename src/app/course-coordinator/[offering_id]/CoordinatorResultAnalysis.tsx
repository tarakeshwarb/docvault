"use client";

import { useState } from "react";
import { Download, Loader2, CheckSquare, Square, FileSpreadsheet } from "lucide-react";

export function CoordinatorResultAnalysis({
  offeringId,
  courseCode,
  components,
}: {
  offeringId: string;
  courseCode: string;
  components: any[];
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(components.map((c) => c.component_id))
  );
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === components.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(components.map((c) => c.component_id)));
    }
  };

  async function downloadExcel() {
    if (selectedIds.size === 0) return;
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch("/api/result-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "consolidated",
          format: "xlsx",
          component_id: Array.from(selectedIds)[0], // For fallback, but backend uses component_ids now
          component_ids: Array.from(selectedIds),
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
      const link = document.createElement("a");
      link.href = url;
      const stamp = new Date().toISOString().split("T")[0];

      // Dynamic name based on selected components
      let namePrefix = courseCode;
      if (selectedIds.size <= 3) {
        const names = components
          .filter((c) => selectedIds.has(c.component_id))
          .map((c) => c.component_name)
          .join(" & ");
        namePrefix = `${names} - ${courseCode}`;
      }

      link.download = `${namePrefix} - Result Analysis_${stamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  }

  if (components.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50 py-12 text-center">
        <FileSpreadsheet className="mb-3 h-8 w-8 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900">No components</h3>
        <p className="mt-1 text-xs text-gray-500">
          Add components in the Overview tab to generate result analysis.
        </p>
      </div>
    );
  }

  const allSelected = selectedIds.size === components.length && components.length > 0;
  const someSelected = selectedIds.size > 0 && selectedIds.size < components.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">Export Result Analysis</h2>
          <p className="text-sm text-gray-500">Select components to include in the exported Excel workbook.</p>
        </div>
        <button
          onClick={downloadExcel}
          disabled={selectedIds.size === 0 || downloading}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--color-accent)]/90 disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download Excel
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-black/5 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-black/5">
            <tr>
              <th className="px-4 py-3 w-12 text-center">
                <button onClick={toggleAll} className="text-gray-500 hover:text-[var(--color-accent)] transition-colors">
                  {allSelected ? <CheckSquare className="h-5 w-5" /> : someSelected ? <CheckSquare className="h-5 w-5 opacity-50" /> : <Square className="h-5 w-5" />}
                </button>
              </th>
              <th className="px-4 py-3 font-semibold text-gray-500">Component Name</th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-right">Added On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {components.map((c) => {
              const selected = selectedIds.has(c.component_id);
              return (
                <tr
                  key={c.component_id}
                  className={`transition-colors hover:bg-gray-50 cursor-pointer ${selected ? 'bg-blue-50/20' : ''}`}
                  onClick={() => toggle(c.component_id)}
                >
                  <td className="px-4 py-3 text-center">
                    <button className={`${selected ? 'text-[var(--color-accent)]' : 'text-gray-300'}`}>
                      {selected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.component_name}</td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {new Date(c.created_at).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
