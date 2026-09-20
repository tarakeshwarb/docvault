"use client";

import { useState, useRef } from "react";
import { addFacultyAssignments, bulkAddFacultyAssignments, parseAssignmentExcel, type ExcelParsedResult } from "../actions";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { UserPlus, Loader2, Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle } from "lucide-react";

type Faculty = { faculty_id: number; faculty_name: string; designation: string; role: string; email: string };
type Section = { section_id: string; section_name: string };

export function AddFacultyForm({
  offering_id,
  allFaculty,
}: {
  offering_id: string;
  allFaculty: Faculty[];
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"bulk" | "manual">("bulk");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual state
  const [facultyId, setFacultyId] = useState("");
  const [sectionNames, setSectionNames] = useState<string>("");
  const [batch, setBatch] = useState("1");

  // Bulk state
  const [parsedResults, setParsedResults] = useState<ExcelParsedResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const facultyOptions = allFaculty.map((f) => ({
    value: String(f.faculty_id),
    label: `${f.faculty_name} · ${f.designation}`,
  }));



  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!facultyId) return setError("Please select a faculty member.");
    if (!sectionNames.trim()) return setError("Please enter at least one section/classroom.");
    
    setError(null);
    setLoading(true);
    try {
      const parsedSections = sectionNames
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await addFacultyAssignments({
        offering_id,
        faculty_id: parseInt(facultyId),
        section_names: parsedSections,
        batch: parseInt(batch) || 1,
      });

      setFacultyId("");
      setSectionNames("");
      setBatch("1");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add faculty.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await parseAssignmentExcel(formData);
      const resWithCount = res.map(r => ({ ...r, batch: r.batch || 1 }));
      setParsedResults(resWithCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse excel file");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validFaculties = parsedResults.filter(r => !r.error && r.faculty_id && r.section_name);
    if (validFaculties.length === 0) return setError("No valid faculties to assign.");
    
    setError(null);
    setLoading(true);
    try {
      await bulkAddFacultyAssignments({
        offering_id,
        assignments: validFaculties.map(f => ({
          faculty_id: f.faculty_id,
          section_name: f.section_name!,
          batch: f.batch || 1
        }))
      });
      setParsedResults([]);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add faculties.");
    } finally {
      setLoading(false);
    }
  }

  function handleRowChange(index: number, field: "faculty_id" | "section_name" | "batch", value: string) {
    const newResults = [...parsedResults];
    const row = { ...newResults[index] };

    if (field === "section_name") {
      row.section_name = value;
    } else if (field === "faculty_id") {
      const fac = allFaculty.find(f => String(f.faculty_id) === value);
      row.faculty_id = fac?.faculty_id || 0;
      row.faculty_name = fac?.faculty_name || "Unknown";
      row.email = fac?.email || "";
    } else if (field === "batch") {
      row.batch = parseInt(value) || 1;
    }

    if (row.faculty_id && row.section_name) {
      row.error = undefined;
    } else {
      if (!row.faculty_id) row.error = "Faculty not found";
      else if (!row.section_name) row.error = "Section not provided";
    }

    newResults[index] = row;
    setParsedResults(newResults);
  }

  return (
    <div className={open ? "w-full" : ""}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-ink)]/80 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Assign Faculty
        </button>
      ) : (
        <div className="panel-card w-full space-y-4 p-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-semibold text-[var(--color-ink)] text-sm">Assign Faculty</h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-4 border-b border-gray-100 mb-4">
            <button
              onClick={() => setActiveTab("bulk")}
              className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors ${activeTab === "bulk" ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]" : "text-gray-500 hover:text-gray-900"}`}
            >
              Bulk Upload
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors ${activeTab === "manual" ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]" : "text-gray-500 hover:text-gray-900"}`}
            >
              Manual
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">{error}</p>
          )}

          {activeTab === "manual" && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-5">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Faculty Member</label>
                  <SearchableSelect
                    options={facultyOptions}
                    value={facultyId}
                    onChange={setFacultyId}
                    placeholder="Search by name..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Sections / Classrooms</label>
                  <input
                    type="text"
                    value={sectionNames}
                    onChange={(e) => setSectionNames(e.target.value)}
                    placeholder="e.g. A, B, TP101"
                    className="w-full text-sm rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Batch</label>
                  <input
                    type="number"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    min={1}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-6 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-[var(--color-ink)]/80 transition-colors"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Confirm Assignment
                </button>
              </div>
            </form>
          )}

          {activeTab === "bulk" && (
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              {parsedResults.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50">
                  <FileSpreadsheet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-4">
                    Upload an Excel file to extract faculties. Format: <br/>
                    <span className="font-mono text-xs bg-white px-2 py-1 rounded border mt-2 inline-block">S.No | Faculty ID | Email ID | Section/Classroom | Batch</span>
                  </p>
                  <input
                    type="file"
                    accept=".xlsx"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label
                    htmlFor="excel-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[var(--color-accent)] transition-colors shadow-sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Browse Excel File
                  </label>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-600 uppercase">Verification Preview</span>
                    <button type="button" onClick={() => setParsedResults([])} className="text-xs text-[var(--color-accent)] hover:underline font-medium">Clear Data</button>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-white sticky top-0 border-b border-gray-100 shadow-sm z-10">
                        <tr>
                          <th className="px-2 py-2 w-16 text-center font-medium text-gray-500 text-xs uppercase">Status</th>
                          <th className="px-4 py-2 font-medium text-gray-500 text-xs uppercase">Faculty Name</th>
                          <th className="px-4 py-2 font-medium text-gray-500 text-xs uppercase">Section / Classroom</th>
                          <th className="px-4 py-2 w-20 font-medium text-gray-500 text-xs uppercase">Batch</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {parsedResults.map((r, idx) => (
                          <tr key={idx} className={r.error ? "bg-red-50/50" : "hover:bg-gray-50/50 transition-colors"}>
                            <td className="px-2 py-2 text-center">
                              {r.error ? (
                                <div className="flex items-center justify-center text-red-600 text-xs font-medium" title={r.error}>
                                  <AlertCircle className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center text-emerald-600" title="Matched">
                                  <CheckCircle2 className="w-5 h-5" />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <div className="w-80">
                                <SearchableSelect
                                  options={facultyOptions}
                                  value={r.faculty_id ? String(r.faculty_id) : ""}
                                  onChange={(val) => handleRowChange(idx, "faculty_id", val)}
                                  placeholder="Select Faculty..."
                                />
                              </div>
                            </td>
                            <td className="px-4 py-2 font-medium text-[var(--color-accent)]">
                              <input
                                type="text"
                                value={r.section_name || ""}
                                onChange={(e) => handleRowChange(idx, "section_name", e.target.value)}
                                placeholder="e.g. A"
                                className="w-24 rounded border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 bg-white text-gray-900"
                              />
                            </td>
                            <td className="px-4 py-2 text-gray-500">
                              <input
                                type="number"
                                value={r.batch || ""}
                                onChange={(e) => handleRowChange(idx, "batch", e.target.value)}
                                min={1}
                                className="w-16 rounded border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 bg-white text-gray-900"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setParsedResults([])}
                  className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || parsedResults.length === 0}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-6 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-[var(--color-ink)]/80 transition-colors"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Confirm Bulk Assignment
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
