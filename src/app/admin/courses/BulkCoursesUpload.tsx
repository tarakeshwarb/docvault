"use client";

import { useRef, useState } from "react";
import { parseCoursesExcel, bulkAddCourses, type CourseExcelRow } from "../actions";
import { Upload, Loader2, X, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";

export function BulkCoursesUpload() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CourseExcelRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const valid = rows.filter((r) => !r.error);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setError(null);
    setDone(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const parsed = await parseCoursesExcel(fd);
      setRows(parsed);
      if (parsed.length === 0) setError("No rows found. Check the sheet has data below the header.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse the file.");
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleImport() {
    setImporting(true);
    setError(null);
    try {
      const res = await bulkAddCourses(
        valid.map((r) => ({
          course_code: r.course_code,
          course_name: r.course_name,
          course_type: r.course_type,
          year_of_study: r.year_of_study,
          credits: r.credits as number,
        }))
      );
      setDone(res.inserted);
      setRows([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Bulk upload (Excel)
      </button>

      {open && (
        <div className="mt-4 panel-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[var(--color-ink)] text-sm">Bulk upload courses</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Excel columns in order: Course Code · Course Name · Type · Year · Credits (first row = headers).
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={handleFile} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={parsing}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
          >
            {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Choose .xlsx file
          </button>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {done !== null && (
            <p className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4" /> Imported {done} course{done !== 1 ? "s" : ""}.
            </p>
          )}

          {rows.length > 0 && (
            <>
              <div className="overflow-x-auto rounded-lg border border-black/5">
                <table className="w-full text-sm text-left">
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
                        <td className="px-3 py-2 font-medium">{r.course_code || "—"}</td>
                        <td className="px-3 py-2">{r.course_name || "—"}</td>
                        <td className="px-3 py-2">{r.course_type || "—"}</td>
                        <td className="px-3 py-2">{r.year_of_study ?? "—"}</td>
                        <td className="px-3 py-2">{r.credits ?? "—"}</td>
                        <td className="px-3 py-2">
                          {r.error ? (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600">
                              <AlertCircle className="w-3 h-3" /> {r.error}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-green-700">
                              <CheckCircle2 className="w-3 h-3" /> Ready
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
                  {valid.length} ready · {rows.length - valid.length} with issues
                </p>
                <button
                  onClick={handleImport}
                  disabled={importing || valid.length === 0}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-[var(--color-ink)]/80"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Import {valid.length} course{valid.length !== 1 ? "s" : ""}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
