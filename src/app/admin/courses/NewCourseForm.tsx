"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createCourse, parseCoursesExcel, bulkAddCourses, type CourseExcelRow } from "../actions";
import { X, Plus, Loader2, BookOpen, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function NewCourseForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"bulk" | "manual">("bulk");

  // Manual Form State
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualLoading, setManualLoading] = useState(false);

  // Bulk Upload State
  const [rows, setRows] = useState<CourseExcelRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const validRows = rows.filter((r) => !r.error);

  async function handleManualSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setManualError(null);
    setManualLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createCourse(formData);
      closeForm();
      router.refresh();
    } catch (err) {
      setManualError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setManualLoading(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setBulkError(null);
    setDone(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const parsed = await parseCoursesExcel(fd);
      setRows(parsed);
      if (parsed.length === 0) setBulkError("No rows found. Check the sheet has data below the header.");
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Failed to parse the file.");
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function validateCourseRow(row: CourseExcelRow): CourseExcelRow {
    let error: string | undefined = undefined;
    if (!row.course_code) error = "Missing course code.";
    else if (!row.course_name) error = "Missing course name.";
    else if (row.credits === null || isNaN(row.credits)) error = "Missing or invalid credits.";
    return { ...row, error };
  }

  function updateRow(index: number, field: keyof CourseExcelRow, value: any) {
    setRows(prev => {
      const newRows = [...prev];
      const updatedRow = { ...newRows[index], [field]: value };
      newRows[index] = validateCourseRow(updatedRow);
      return newRows;
    });
  }

  async function handleBulkImport() {
    setImporting(true);
    setBulkError(null);
    try {
      const res = await bulkAddCourses(
        validRows.map((r) => ({
          course_code: r.course_code,
          course_name: r.course_name,
          course_type: r.course_type,
          year_of_study: r.year_of_study,
          credits: r.credits as number,
        }))
      );
      setDone(res.inserted);
      setRows([]);
      router.refresh();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  function closeForm() {
    setOpen(false);
    setTab("manual");
    setRows([]);
    setDone(null);
    setBulkError(null);
    setManualError(null);
  }

  return (
    <div className={open ? "w-full sm:min-w-[500px] lg:min-w-[600px] mb-6" : ""}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-ink)]/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Course
        </button>
      ) : (
        <div className="panel-card w-full space-y-4 p-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[var(--color-ink)]">
                <BookOpen className="w-4 h-4" />
                <h3 className="font-semibold text-sm">Add New Course</h3>
              </div>
            </div>
            <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-4 border-b border-gray-100 mb-4">
            <button
              onClick={() => setTab("bulk")}
              className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors ${tab === "bulk" ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]" : "text-gray-500 hover:text-gray-900"}`}
            >
              Bulk Upload
            </button>
            <button
              onClick={() => setTab("manual")}
              className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors ${tab === "manual" ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]" : "text-gray-500 hover:text-gray-900"}`}
            >
              Manual
            </button>
          </div>
          
          {tab === "manual" ? (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-ink)] mb-1.5">
                    Course Code
                  </label>
                  <input
                    name="course_code"
                    required
                    placeholder="e.g. CS301"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-ink)] mb-1.5">
                    Course Name
                  </label>
                  <input
                    name="course_name"
                    required
                    placeholder="e.g. Data Structures and Algorithms"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-ink)] mb-1.5">
                    Credits
                  </label>
                  <input
                    name="credits"
                    type="number"
                    min={1}
                    max={10}
                    required
                    placeholder="e.g. 4"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-ink)] mb-1.5">
                    Course Type <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    name="course_type"
                    maxLength={2}
                    placeholder="e.g. T, L, EL"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] uppercase"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[var(--color-ink)] mb-1.5">
                    Year of Study <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    name="year_of_study"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] bg-white"
                    defaultValue=""
                  >
                    <option value="">N/A (Any Year)</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">5th Year</option>
                  </select>
                </div>
              </div>

              {manualError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">{manualError}</p>
              )}
              
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={manualLoading}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-6 py-2 text-sm font-medium text-white hover:bg-[var(--color-ink)]/80 disabled:opacity-50 transition-colors"
                >
                  {manualLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {manualLoading ? "Creating..." : "Create Course"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {rows.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50">
                  <FileSpreadsheet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <div className="text-sm text-gray-600 mb-4">
                    Upload an Excel file to extract courses. Format: <br/>
                    <div className="font-mono text-xs bg-white px-3 py-2 rounded border mt-2 inline-flex items-center gap-3 text-center mx-auto whitespace-nowrap overflow-x-auto max-w-full">
                      <div>Course<br/>Code</div>
                      <div className="w-px h-6 bg-gray-200"></div>
                      <div>Course<br/>Name</div>
                      <div className="w-px h-6 bg-gray-200"></div>
                      <div>Type</div>
                      <div className="w-px h-6 bg-gray-200"></div>
                      <div>Year</div>
                      <div className="w-px h-6 bg-gray-200"></div>
                      <div>Credits</div>
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept=".xlsx" className="hidden" id="excel-upload-courses" onChange={handleFile} />
                  <label
                    htmlFor="excel-upload-courses"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[var(--color-accent)] transition-colors shadow-sm"
                  >
                    {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Browse Excel File
                  </label>
                </div>
              ) : null}

              {bulkError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{bulkError}</p>}
              {done !== null && (
                <p className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4" /> Imported {done} course{done !== 1 ? "s" : ""}.
                </p>
              )}

              {rows.length > 0 && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-lg border border-black/5">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50/70 text-gray-500 border-b border-black/5">
                        <tr>
                          <th className="px-3 py-2">Code</th>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2">Year</th>
                          <th className="px-3 py-2">Credits</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {rows.map((r, i) => (
                          <tr key={i} className={r.error ? "bg-red-50/40" : ""}>
                            <td className="px-1 py-1">
                              <input
                                type="text"
                                value={r.course_code || ""}
                                onChange={(e) => updateRow(i, "course_code", e.target.value)}
                                className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:bg-white px-2 py-1 rounded text-xs outline-none transition-all"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="text"
                                value={r.course_name || ""}
                                onChange={(e) => updateRow(i, "course_name", e.target.value)}
                                className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:bg-white px-2 py-1 rounded text-xs outline-none transition-all"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="text"
                                value={r.course_type || ""}
                                onChange={(e) => updateRow(i, "course_type", e.target.value)}
                                className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:bg-white px-2 py-1 rounded text-xs outline-none uppercase transition-all"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="number"
                                value={r.year_of_study || ""}
                                onChange={(e) => updateRow(i, "year_of_study", e.target.value ? parseInt(e.target.value, 10) : null)}
                                className="w-16 bg-transparent border border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:bg-white px-2 py-1 rounded text-xs outline-none transition-all"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="number"
                                value={r.credits ?? ""}
                                onChange={(e) => updateRow(i, "credits", e.target.value ? parseInt(e.target.value, 10) : null)}
                                className="w-16 bg-transparent border border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:bg-white px-2 py-1 rounded text-xs outline-none transition-all"
                              />
                            </td>
                            <td className="px-3 py-2">
                              {r.error ? (
                                <span className="inline-flex items-center gap-1 text-red-600">
                                  <AlertCircle className="w-3 h-3 shrink-0" /> <span className="truncate max-w-[150px]" title={r.error}>{r.error}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-green-700">
                                  <CheckCircle2 className="w-3 h-3 shrink-0" /> Ready
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {validRows.length} ready · {rows.length - validRows.length} with issues
                    </p>
                    <button
                      onClick={() => { setRows([]); setDone(null); setBulkError(null); }}
                      className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 rounded-full transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleBulkImport}
                      disabled={importing || validRows.length === 0}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2 text-xs font-medium text-white disabled:opacity-50 hover:bg-[var(--color-ink)]/80 transition-colors"
                    >
                      {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      Import {validRows.length} course{validRows.length !== 1 ? "s" : ""}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
