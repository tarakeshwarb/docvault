"use client";

import { useState, useEffect, useMemo } from "react";
import { Download, Loader2, CheckSquare, Square, FileSpreadsheet, ChevronDown, BookOpen } from "lucide-react";
import { getGlobalResultAnalysisData } from "@/app/actions/result-analysis-actions";

type Dept = { department_id: string; department_name: string; offering_id: string | null };
type Component = { component_id: string; component_name: string; created_at: string };

type Course = {
  offering_id: string;
  course_code: string;
  course_name: string;
};

export function GlobalResultAnalysis({
  courses,
}: {
  courses: Course[];
}) {
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null);
  
  // Data for selected course
  const [loading, setLoading] = useState(false);
  const [deptOfferings, setDeptOfferings] = useState<Dept[]>([]);
  const [components, setComponents] = useState<Component[]>([]);

  // Selection states
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedComponentIds, setSelectedComponentIds] = useState<Set<string>>(new Set());
  const [downloadingType, setDownloadingType] = useState<"section" | "overall" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-select first course if only one
  useEffect(() => {
    if (courses.length === 1 && !selectedOfferingId) {
      setSelectedOfferingId(courses[0].offering_id);
    }
  }, [courses, selectedOfferingId]);

  // Fetch data when course changes
  useEffect(() => {
    if (!selectedOfferingId) {
      setDeptOfferings([]);
      setComponents([]);
      return;
    }

    let isMounted = true;
    setLoading(true);
    getGlobalResultAnalysisData(selectedOfferingId)
      .then((data) => {
        if (isMounted) {
          setDeptOfferings(data.deptOfferings);
          setComponents(data.components);
          setSelectedDept("all");
          setSelectedComponentIds(new Set());
          setError(null);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [selectedOfferingId]);

  const selectedCourseCode = courses.find(c => c.offering_id === selectedOfferingId)?.course_code || "Course";

  // Derive which depts to show
  const activeDepts = selectedDept === "all"
    ? deptOfferings.filter(d => d.offering_id)
    : deptOfferings.filter(d => d.department_id === selectedDept && d.offering_id);

  const toggleComponent = (id: string) => {
    const next = new Set(selectedComponentIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedComponentIds(next);
  };

  const toggleAllComponents = () => {
    if (selectedComponentIds.size === components.length) {
      setSelectedComponentIds(new Set());
    } else {
      setSelectedComponentIds(new Set(components.map(c => c.component_id)));
    }
  };

  const handleDeptChange = (deptId: string) => {
    setSelectedDept(deptId);
    setSelectedComponentIds(new Set());
    setError(null);
  };

  async function triggerDownload(scope: "consolidated" | "overall") {
    if (selectedComponentIds.size === 0 || activeDepts.length === 0 || !selectedOfferingId) return;
    setDownloadingType(scope === "consolidated" ? "section" : "overall");
    setError(null);

    try {
      const res = await fetch("/api/result-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          format: "xlsx",
          component_ids: Array.from(selectedComponentIds),
          offering_id: selectedOfferingId,
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
      
      link.download = `${selectedCourseCode} - ${deptLabel} - ${typeLabel} Result Analysis_${stamp}.xlsx`;
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

  const allSelected = selectedComponentIds.size === components.length && components.length > 0;
  const someSelected = selectedComponentIds.size > 0 && selectedComponentIds.size < components.length;

  return (
    <div className="space-y-6">
      {/* Course Selector */}
      {courses.length > 1 ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Select Course for Analysis</label>
          <div className="relative max-w-sm">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedOfferingId || ""}
              onChange={(e) => setSelectedOfferingId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-10 text-sm text-gray-700 shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            >
              <option value="" disabled>-- Select a course --</option>
              {courses.map(c => (
                <option key={c.offering_id} value={c.offering_id}>
                  {c.course_code} - {c.course_name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      ) : courses.length === 1 ? (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Course</label>
          <div className="flex items-center gap-2 text-[var(--color-ink)] bg-gray-50 px-3 py-2 rounded-lg border border-black/5 w-fit">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{courses[0].course_code} - {courses[0].course_name}</span>
          </div>
        </div>
      ) : null}

      {selectedOfferingId && (
        <div className="pt-4 border-t border-black/5 space-y-6">
          {/* Header + Download buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-ink)]">Export Result Analysis</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => triggerDownload("consolidated")}
                disabled={selectedComponentIds.size === 0 || downloadingType !== null}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--color-ink)]/90 disabled:opacity-50"
              >
                {downloadingType === "section" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download Section-Wise
              </button>
              <button
                onClick={() => triggerDownload("overall")}
                disabled={selectedComponentIds.size === 0 || downloadingType !== null}
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

          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : components.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50 py-12 text-center">
              <FileSpreadsheet className="mb-3 h-8 w-8 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">No components available</h3>
              <p className="mt-1 text-xs text-gray-500">
                This course has no components configured yet.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-black/5 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-black/5">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">
                      <button onClick={toggleAllComponents} className="text-gray-500 hover:text-[var(--color-accent)] transition-colors">
                        {allSelected ? <CheckSquare className="h-5 w-5" /> : someSelected ? <CheckSquare className="h-5 w-5 opacity-50" /> : <Square className="h-5 w-5" />}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-500">Component Name</th>
                    <th className="px-4 py-3 font-semibold text-gray-500 text-right">Added On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {components.map(c => {
                    const selected = selectedComponentIds.has(c.component_id);
                    return (
                      <tr
                        key={c.component_id}
                        className={`transition-colors hover:bg-gray-50 cursor-pointer ${selected ? "bg-blue-50/20" : ""}`}
                        onClick={() => toggleComponent(c.component_id)}
                      >
                        <td className="px-4 py-3 text-center">
                          <button className={selected ? "text-[var(--color-accent)]" : "text-gray-300"}>
                            {selected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{c.component_name}</td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
