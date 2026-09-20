"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createCourseOffering, parseOfferingsExcel, bulkAddOfferings, type OfferingExcelRow } from "../actions";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Plus, X, Loader2, Link2, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Course = { course_id: string; course_code: string; course_name: string; year_of_study: number | null };
type Semester = { semester_id: string; semester_name: string; year_name: string };
type Faculty = { faculty_id: number; faculty_name: string; designation: string; role: string };

export function NewOfferingForm({
  courses,
  semesters,
  coordinators,
  departments,
}: {
  courses: Course[];
  semesters: Semester[];
  coordinators: Faculty[];
  departments: { department_id: string; department_name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"bulk" | "manual">("bulk");

  // Manual Form State
  const [courseId, setCourseId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [primaryCoordinatorId, setPrimaryCoordinatorId] = useState("");
  const [deptCoordinatorRows, setDeptCoordinatorRows] = useState<{ id: string; dept: string }[]>([{ id: "", dept: "" }]);
  const [auditProfessorRows, setAuditProfessorRows] = useState<{id: string}[]>([{id: ""}]);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [yearFilter, setYearFilter] = useState<string>("all");

  // Bulk Upload State
  const [rows, setRows] = useState<OfferingExcelRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredCourses = yearFilter === "all" 
    ? courses 
    : courses.filter(c => c.year_of_study === parseInt(yearFilter, 10));

  const courseOptions = filteredCourses.map((c) => ({
    value: c.course_id,
    label: `${c.course_code} — ${c.course_name}`,
  }));

  const semesterOptions = semesters.map((s) => ({
    value: s.semester_id,
    label: `${s.semester_name} — ${s.year_name}`,
  }));

  const coordinatorOptions = [
    { value: "", label: "None (assign later)" },
    ...coordinators.map((f) => ({
      value: String(f.faculty_id),
      label: `${f.faculty_id} - ${f.faculty_name} · ${f.designation}`,
    })),
  ];

  const deptCoordinatorOptions = coordinators
    .map((f) => ({
      value: String(f.faculty_id),
      label: `${f.faculty_id} - ${f.faculty_name} · ${f.designation}`,
    }));

  const auditProfessorOptions = coordinators.map((f) => ({
    value: String(f.faculty_id),
    label: `${f.faculty_id} - ${f.faculty_name} · ${f.designation}`,
  }));

  function addDeptCoordinatorRow() {
    setDeptCoordinatorRows((prev) => [...prev, { id: "", dept: "" }]);
  }
  function updateDeptCoordinatorRow(index: number, id: string, dept: string) {
    setDeptCoordinatorRows((prev) => {
      const newRows = [...prev];
      newRows[index] = { id, dept };
      return newRows;
    });
  }
  function removeDeptCoordinatorRow(index: number) {
    setDeptCoordinatorRows((prev) => prev.filter((_, i) => i !== index));
  }

  const addAuditProfessorRow = () => setAuditProfessorRows([...auditProfessorRows, {id: ""}]);
  const removeAuditProfessorRow = (index: number) => setAuditProfessorRows(auditProfessorRows.filter((_, i) => i !== index));
  const updateAuditProfessorRow = (index: number, value: string) => {
    const newRows = [...auditProfessorRows];
    newRows[index].id = value;
    setAuditProfessorRows(newRows);
  };

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId || !semesterId) {
      setManualError("Please select a course and semester.");
      return;
    }
    setManualError(null);
    setManualLoading(true);
    try {
      await createCourseOffering({
        course_id: courseId,
        semester_id: semesterId,
        primary_coordinator_id: primaryCoordinatorId ? parseInt(primaryCoordinatorId) : null,
        dept_coordinator_ids: deptCoordinatorRows
          .filter((r) => r.id !== "" && r.dept !== "")
          .map((r) => ({ faculty_id: parseInt(r.id, 10), department_id: r.dept })),
        audit_professor_ids: auditProfessorRows.filter(r => r.id).map(r => parseInt(r.id)),
      });
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
      const parsed = await parseOfferingsExcel(fd);
      setRows(parsed);
      if (parsed.length === 0) setBulkError("No rows found. Check the sheet has data below the header.");
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Failed to parse the file.");
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function validateOfferingRow(row: OfferingExcelRow & { _raw_sec?: string, _raw_audit?: string, _raw_primary?: string }): OfferingExcelRow {
    let error: string | undefined = undefined;
    
    if (!row.course_code && !row.semester_name && !row.year_name) return row;

    const courseCodeLower = row.course_code?.toLowerCase() || "";
    const semLower = row.semester_name?.toLowerCase() || "";
    const yearLower = row.year_name?.toLowerCase() || "";

    const course = courses.find(c => c.course_code.toLowerCase() === courseCodeLower);
    const semester = semesters.find(s => s.semester_name.toLowerCase() === semLower && s.year_name.toLowerCase() === yearLower);

    if (!course) error = `Course code '${row.course_code}' not found.`;
    else if (!semester) error = `Semester '${row.semester_name}' in year '${row.year_name}' not found.`;
    else if (row.primary_coordinator_id !== null && isNaN(row.primary_coordinator_id as number)) error = "Invalid SOC Coordinator ID.";
    else if (row.primary_coordinator_id && !coordinators.find(f => String(f.faculty_id) === String(row.primary_coordinator_id))) error = `SOC coordinator ${row.primary_coordinator_id} not found.`;

    if (!error) {
      for (const id of row.dept_coordinator_ids) {
        if (!coordinators.find(f => String(f.faculty_id) === String(id))) {
          error = `Dept coordinator ${id} not found.`;
          break;
        }
      }
    }
    if (!error) {
      for (const id of row.audit_professor_ids) {
        if (!coordinators.find(f => String(f.faculty_id) === String(id))) {
          error = `Audit professor ${id} not found.`;
          break;
        }
      }
    }

    return { 
      ...row, 
      course_id: course?.course_id || "", 
      semester_id: semester?.semester_id || "", 
      error 
    };
  }

  function updateRow(index: number, field: string, value: any) {
    setRows(prev => {
      const newRows = [...prev];
      let updatedRow = { ...newRows[index] } as any;
      updatedRow[field] = value;

      if (field === '_raw_sec') {
        updatedRow.dept_coordinator_ids = value ? String(value).split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)) : [];
      } else if (field === '_raw_audit') {
        updatedRow.audit_professor_ids = value ? String(value).split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)) : [];
      } else if (field === '_raw_primary') {
        const parsed = parseInt(value, 10);
        updatedRow.primary_coordinator_id = isNaN(parsed) ? null : parsed;
      }

      newRows[index] = validateOfferingRow(updatedRow);
      return newRows;
    });
  }

  const validRows = rows.filter((r) => !r.error);

  async function handleBulkImport() {
    setImporting(true);
    setBulkError(null);
    try {
      const res = await bulkAddOfferings(validRows);
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
    // Reset manual
    setCourseId("");
    setSemesterId("");
    setPrimaryCoordinatorId("");
    setDeptCoordinatorRows([{ id: "", dept: "" }]);
    setAuditProfessorRows([{ id: "" }]);
    setManualError(null);
    // Reset bulk
    setRows([]);
    setDone(null);
    setBulkError(null);
  }

  return (
    <div className={open ? "w-full sm:min-w-[600px] lg:min-w-[800px] mb-6" : ""}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-ink)]/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Offering
        </button>
      ) : (
        <div className="panel-card w-full space-y-4 p-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[var(--color-ink)]">
                <Link2 className="w-4 h-4" />
                <h3 className="font-semibold text-sm">New Course Offering</h3>
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
            <form onSubmit={handleManualSubmit} className="space-y-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                <div className="w-full sm:w-1/3">
                  <label className="block text-xs font-medium text-[var(--color-ink)] mb-2">
                    Filter by Year
                  </label>
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] bg-white h-10"
                  >
                    <option value="all">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">5th Year</option>
                  </select>
                </div>
                <div className="w-full sm:w-2/3">
                  <label className="block text-xs font-medium text-[var(--color-ink)] mb-2">
                    Select Course
                  </label>
                  <SearchableSelect
                    options={courseOptions}
                    value={courseId}
                    onChange={setCourseId}
                    placeholder="Search by course code or name..."
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                <div className="w-full">
                  <label className="block text-xs font-medium text-[var(--color-ink)] mb-2">
                    Select Semester
                  </label>
                  <SearchableSelect
                    options={semesterOptions}
                    value={semesterId}
                    onChange={setSemesterId}
                    placeholder="Search semester..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-ink)] mb-2">
                  SOC Coordinator
                </label>
                <SearchableSelect
                  options={coordinatorOptions}
                  value={primaryCoordinatorId}
                  onChange={setPrimaryCoordinatorId}
                  placeholder="Search faculty by name or employee ID..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-ink)] mb-2">
                  Dept Coordinators
                </label>
                <div className="space-y-2">
                  {deptCoordinatorRows.map((row, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-[2]">
                        <SearchableSelect
                          options={deptCoordinatorOptions}
                          value={row.id}
                          onChange={(value) => updateDeptCoordinatorRow(index, value, row.dept)}
                          placeholder="Search faculty..."
                        />
                      </div>
                      <div className="flex-1 min-w-[140px]">
                        <select
                          value={row.dept}
                          onChange={(e) => updateDeptCoordinatorRow(index, row.id, e.target.value)}
                          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                        >
                          <option value="">Select Dept</option>
                          {departments.map((d) => (
                            <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDeptCoordinatorRow(index)}
                        className="inline-flex items-center justify-center rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-200 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addDeptCoordinatorRow}
                    className="inline-flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--color-accent)]/80 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Dept Coordinator
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-ink)] mb-2">
                  Audit Professors
                </label>
                <div className="space-y-2">
                  {auditProfessorRows.map((row, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1">
                        <SearchableSelect
                          options={auditProfessorOptions}
                          value={row.id}
                          onChange={(value) => updateAuditProfessorRow(index, value)}
                          placeholder="Search faculty..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAuditProfessorRow(index)}
                        className="inline-flex items-center justify-center rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-200 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAuditProfessorRow}
                    className="inline-flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--color-accent)]/80 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Audit Professor
                  </button>
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
                  {manualLoading ? "Creating..." : "Create Offering"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {rows.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50">
                  <FileSpreadsheet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <div className="text-sm text-gray-600 mb-4">
                    Upload an Excel file to extract offerings. Format: <br/>
                    <div className="font-mono text-xs bg-white px-3 py-2 rounded border mt-2 inline-flex items-center gap-3 text-center mx-auto whitespace-nowrap overflow-x-auto max-w-full">
                      <div>Course<br/>Code</div>
                      <div className="w-px h-6 bg-gray-200"></div>
                      <div>Semester<br/>Name</div>
                      <div className="w-px h-6 bg-gray-200"></div>
                      <div>Academic<br/>Year</div>
                      <div className="w-px h-6 bg-gray-200"></div>
                      <div>Primary<br/>Coord ID</div>
                      <div className="w-px h-6 bg-gray-200"></div>
                      <div>Dept<br/>Coord IDs</div>
                      <div className="w-px h-6 bg-gray-200"></div>
                      <div>Audit<br/>Prof IDs</div>
                    </div>
                    <br/><span className="text-xs text-gray-400 mt-1 inline-block">Example IDs for multiple coords: "100394, 100395"</span>
                  </div>
                  <input ref={fileRef} type="file" accept=".xlsx" className="hidden" id="excel-upload-offerings" onChange={handleFile} />
                  <label
                    htmlFor="excel-upload-offerings"
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
                  <CheckCircle2 className="w-4 h-4" /> Imported {done} offering{done !== 1 ? "s" : ""}.
                </p>
              )}

              {rows.length > 0 && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-lg border border-black/5 max-h-[400px]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50/70 text-gray-500 border-b border-black/5 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Code</th>
                          <th className="px-3 py-2">Semester</th>
                          <th className="px-3 py-2">Year</th>
                          <th className="px-3 py-2">Primary</th>
                          <th className="px-3 py-2">Dept</th>
                          <th className="px-3 py-2">Audit</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {rows.map((r: any, i) => (
                          <tr key={i} className={r.error ? "bg-red-50/40" : ""}>
                            <td className="px-1 py-1">
                              <input
                                type="text"
                                value={r.course_code || ""}
                                onChange={(e) => updateRow(i, "course_code", e.target.value)}
                                className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:bg-white px-2 py-1 rounded text-xs outline-none transition-all font-medium"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="text"
                                value={r.semester_name || ""}
                                onChange={(e) => updateRow(i, "semester_name", e.target.value)}
                                className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:bg-white px-2 py-1 rounded text-xs outline-none transition-all"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="text"
                                value={r.year_name || ""}
                                onChange={(e) => updateRow(i, "year_name", e.target.value)}
                                className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:bg-white px-2 py-1 rounded text-xs outline-none transition-all"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="text"
                                value={r._raw_primary ?? r.primary_coordinator_id ?? ""}
                                onChange={(e) => updateRow(i, "_raw_primary", e.target.value)}
                                className="w-16 bg-transparent border border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:bg-white px-2 py-1 rounded text-xs outline-none transition-all"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="text"
                                value={r._raw_sec ?? r.dept_coordinator_ids?.join(', ') ?? ""}
                                onChange={(e) => updateRow(i, "_raw_sec", e.target.value)}
                                placeholder="103, 104"
                                className="w-24 bg-transparent border border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:bg-white px-2 py-1 rounded text-xs outline-none transition-all"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="text"
                                value={r._raw_audit ?? r.audit_professor_ids?.join(', ') ?? ""}
                                onChange={(e) => updateRow(i, "_raw_audit", e.target.value)}
                                placeholder="105"
                                className="w-24 bg-transparent border border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:bg-white px-2 py-1 rounded text-xs outline-none transition-all"
                              />
                            </td>
                            <td className="px-3 py-2">
                              {r.error ? (
                                <span className="inline-flex items-center gap-1 text-red-600">
                                  <AlertCircle className="w-3 h-3 shrink-0" /> <span className="truncate max-w-[200px]" title={r.error}>{r.error}</span>
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
                      Import {validRows.length} offering{validRows.length !== 1 ? "s" : ""}
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
