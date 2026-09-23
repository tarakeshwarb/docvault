"use client";

import { useState } from "react";
import { Download, Loader2, CheckSquare, Square, FileSpreadsheet, ChevronDown } from "lucide-react";

type Dept = { department_id: string; department_name: string; offering_id: string | null };
type Component = { component_id: string; component_name: string };

export function SocResultAnalysis({
  deptOfferings,
  componentsByOffering,
  courseCode,
}: {
  deptOfferings: Dept[];
  componentsByOffering: Record<string, Component[]>;
  courseCode: string;
}) {
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [downloadingType, setDownloadingType] = useState<"section" | "overall" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derive which offering_ids to use
  const activeDepts = selectedDept === "all"
    ? deptOfferings.filter(d => d.offering_id)
    : deptOfferings.filter(d => d.department_id === selectedDept && d.offering_id);

  // Get unique components across all selected offerings
  const allComponents: Component[] = [];
  const seenIds = new Set<string>();
  for (const dept of activeDepts) {
    const comps = componentsByOffering[dept.offering_id!] || [];
    for (const c of comps) {
      if (!seenIds.has(c.component_id)) {
        seenIds.add(c.component_id);
        allComponents.push(c);
      }
    }
  }

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === allComponents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allComponents.map(c => c.component_id)));
    }
  };

  // When dept changes, reset selection
  const handleDeptChange = (deptId: string) => {
    setSelectedDept(deptId);
    setSelectedIds(new Set());
    setError(null);
  };

  async function triggerDownload(scope: "consolidated" | "overall") {
    if (selectedIds.size === 0 || activeDepts.length === 0) return;
    setDownloadingType(scope === "consolidated" ? "section" : "overall");
    setError(null);

    // For each active dept offering, download separately (or pick first offering_id for "all")
    try {
      // Use the first matching offering_id (they share the same course / components)
      const offeringId = activeDepts[0].offering_id!;

      const res = await fetch("/api/result-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          format: "xlsx",
          component_ids: Array.from(selectedIds),
          offering_id: offeringId,
        }),
      });
      if (!res.ok) {
        let msg = "Download failed.";
        try { const d = await res.json(); if (d?.error) msg = d.error; } catch {}
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const stamp = new Date().toISOString().split("T")[0];
      const deptLabel = selectedDept === "all" ? "All-Depts" : (activeDepts[0] as any).department_name || "Dept";
      const typeLabel = scope === "consolidated" ? "Section-Wise" : "Overall";
      link.download = `${courseCode} - ${deptLabel} - ${typeLabel} Result Analysis_${stamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setDownloadingType(null);
    }
  }

  const allSelected = selectedIds.size === allComponents.length && allComponents.length > 0;
  const someSelected = selectedIds.size > 0 && selectedIds.size < allComponents.length;

  return (
    <div className="space-y-6">
      {/* Header + Download buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">Export Result Analysis</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => triggerDownload("consolidated")}
            disabled={selectedIds.size === 0 || downloadingType !== null}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--color-ink)]/90 disabled:opacity-50"
          >
            {downloadingType === "section" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download Section-Wise
          </button>
          <button
            onClick={() => triggerDownload("overall")}
            disabled={selectedIds.size === 0 || downloadingType !== null}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--color-accent)]/90 disabled:opacity-50"
          >
            {downloadingType === "overall" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download Overall
          </button>
        </div>
      </div>

      {/* Dept selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleDeptChange("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors border ${
            selectedDept === "all"
              ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
              : "bg-white text-gray-600 border-gray-200 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          }`}
        >
          All Depts
        </button>
        {deptOfferings.filter(d => d.offering_id).map(dept => (
          <button
            key={dept.department_id}
            onClick={() => handleDeptChange(dept.department_id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors border ${
              selectedDept === dept.department_id
                ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            }`}
          >
            {dept.department_name}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {allComponents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50 py-12 text-center">
          <FileSpreadsheet className="mb-3 h-8 w-8 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">No components available</h3>
          <p className="mt-1 text-xs text-gray-500">
            {selectedDept === "all"
              ? "No offerings have components configured yet."
              : "This department's offering has no components configured yet."}
          </p>
        </div>
      ) : (
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
              {allComponents.map(c => {
                const selected = selectedIds.has(c.component_id);
                return (
                  <tr
                    key={c.component_id}
                    className={`transition-colors hover:bg-gray-50 cursor-pointer ${selected ? "bg-blue-50/20" : ""}`}
                    onClick={() => toggle(c.component_id)}
                  >
                    <td className="px-4 py-3 text-center">
                      <button className={selected ? "text-[var(--color-accent)]" : "text-gray-300"}>
                        {selected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.component_name}</td>
                    
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
