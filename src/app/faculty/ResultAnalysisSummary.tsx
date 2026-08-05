"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllSavedAnalysesAction } from "./result-analysis-actions";
import { BarChart3, Loader2, RefreshCw, FileSpreadsheet } from "lucide-react";

const RANGE_LABELS = ["0-49", "50-59", "60-69", "70-79", "80-89", "90-100"];

type SavedRow = {
  component_id: string;
  component_name: string;
  section_name: string;
  faculty_assignment_id: string;
  total_strength: number;
  total_absentees: number;
  ranges: number[];
  pass_pct: number;
  updated_at: string | null;
};

export function ResultAnalysisSummary({
  offeringId,
  facultyAssignmentId,
  courseCode,
  courseName,
  sectionName,
}: {
  offeringId: string;
  facultyAssignmentId: string;
  courseCode: string;
  courseName: string;
  sectionName: string;
}) {
  const [rows, setRows] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllSavedAnalysesAction(facultyAssignmentId);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, [facultyAssignmentId]);

  useEffect(() => {
    load();
  }, [load]);



  async function downloadTemplate(componentId: string) {
    setDownloading(componentId);
    setError(null);
    try {
      const res = await fetch("/api/result-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "section",
          format: "xlsx",
          component_id: componentId,
          faculty_assignment_id: facultyAssignmentId,
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
      link.download = `${courseCode}_section_RA_${stamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
            Saved Result Analysis
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {courseCode} · {courseName} · Section {sectionName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No data saved yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Open the Result Analysis modal, fill in the data, and click Save.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/5">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-black/5">
              <tr>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Component</th>
                {RANGE_LABELS.map((l) => (
                  <th key={l} className="px-2 py-3 text-xs font-semibold text-gray-500 text-center whitespace-nowrap bg-blue-50/50">
                    {l}
                  </th>
                ))}
                <th className="px-2 py-3 text-xs font-semibold text-gray-500 text-center leading-snug w-16">Total Strength</th>
                <th className="px-2 py-3 text-xs font-semibold text-gray-500 text-center leading-snug w-24">No. of Students Attended</th>
                <th className="px-2 py-3 text-xs font-semibold text-gray-500 text-center leading-snug w-16">Absentees</th>
                <th className="px-2 py-3 text-xs font-semibold text-gray-500 text-center leading-snug w-16">Failures</th>
                <th className="px-2 py-3 text-xs font-semibold text-gray-500 text-center leading-snug w-16">Total Pass</th>
                <th className="px-2 py-3 text-xs font-semibold text-gray-500 text-center whitespace-nowrap">Pass %</th>
                <th className="px-2 py-3 text-xs font-semibold text-gray-500 text-center whitespace-nowrap">Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {rows.map((row) => {
                const present = row.total_strength - row.total_absentees;
                const failures = row.ranges[0];
                const totalPass = present - failures;
                const savedDate = row.updated_at
                  ? new Date(row.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                  : "—";
                return (
                  <tr key={`${row.component_id}-${row.section_name}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-3 font-semibold text-[var(--color-ink)] whitespace-nowrap">
                      {row.component_name}
                      <div className="text-[10px] font-normal text-gray-400 mt-0.5">{savedDate}</div>
                    </td>
                    {row.ranges.map((v, i) => (
                      <td key={i} className="px-2 py-3 text-center text-gray-700 bg-blue-50/30 font-medium">{v}</td>
                    ))}
                    <td className="px-2 py-3 text-center font-semibold text-gray-800">{row.total_strength}</td>
                    <td className="px-2 py-3 text-center font-semibold text-gray-800">{present}</td>
                    <td className="px-2 py-3 text-center text-gray-700">{row.total_absentees}</td>
                    <td className="px-2 py-3 text-center font-medium text-red-600">{failures}</td>
                    <td className="px-2 py-3 text-center font-medium text-green-700">{totalPass}</td>
                    <td className="px-2 py-3 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        row.pass_pct >= 75
                          ? "bg-green-100 text-green-700"
                          : row.pass_pct >= 50
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {row.pass_pct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <button
                        onClick={() => downloadTemplate(row.component_id)}
                        disabled={downloading === row.component_id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 hover:border-[var(--color-accent)]/20 transition-all disabled:opacity-50"
                        title="Download Analysis Type Excel"
                      >
                        {downloading === row.component_id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                        )}
                        Template
                      </button>
                    </td>
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
