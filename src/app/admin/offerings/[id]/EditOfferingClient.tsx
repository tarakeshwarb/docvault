"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateCourseOffering, deleteCourseOffering, CourseOffering } from "../../actions";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Trash2, Plus, X } from "lucide-react";

type Course = { course_id: string; course_code: string; course_name: string };
type Semester = { semester_id: string; semester_name: string; year_name: string };
type Faculty = { faculty_id: number; faculty_name: string; designation: string; role: string };

export default function EditOfferingClient({
  offering,
  courses,
  semesters,
  coordinators,
  departments,
}: {
  offering: CourseOffering;
  courses: Course[];
  semesters: Semester[];
  coordinators: Faculty[];
  departments: { department_id: string; department_name: string }[];
}) {
  const router = useRouter();
  const [courseId, setCourseId] = useState(offering.course_id);
  const [semesterId, setSemesterId] = useState(offering.semester_id);
  const [primaryCoordinatorId, setPrimaryCoordinatorId] = useState("");
  const [deptCoordinatorRows, setDeptCoordinatorRows] = useState<{ id: string; dept: string }[]>([{ id: "", dept: "" }]);
  const [auditProfessorRows, setAuditProfessorRows] = useState<{ id: string }[]>([{ id: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize state from offering data
  useEffect(() => {
    setPrimaryCoordinatorId(offering.primary_coordinator.faculty_id ? String(offering.primary_coordinator.faculty_id) : "");
    setDeptCoordinatorRows(offering.dept_coordinators.length > 0 
      ? offering.dept_coordinators.map(c => ({ id: String(c.faculty_id), dept: c.department_id || "" })) 
      : [{ id: "", dept: "" }]);
    setAuditProfessorRows(offering.audit_professors.length > 0 
      ? offering.audit_professors.map(a => ({id: String(a.faculty_id)})) 
      : [{id: ""}]);
  }, [offering]);

  const courseOptions = courses.map((c) => ({
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
      label: `${f.faculty_name} · ${f.designation}`,
    })),
  ];

  const deptCoordinatorOptions = coordinators
    .map((f) => ({
      value: String(f.faculty_id),
      label: `${f.faculty_name} · ${f.designation}`,
    }));

  const auditProfessorOptions = coordinators.map((f) => ({
    value: String(f.faculty_id),
    label: `${f.faculty_name} · ${f.designation}`,
  }));

  const addDeptCoordinatorRow = () => {
    setDeptCoordinatorRows([...deptCoordinatorRows, { id: "", dept: "" }]);
  };

  const removeDeptCoordinatorRow = (index: number) => {
    setDeptCoordinatorRows(deptCoordinatorRows.filter((_, i) => i !== index));
  };

  const updateDeptCoordinatorRow = (index: number, id: string, dept: string) => {
    const newRows = [...deptCoordinatorRows];
    newRows[index] = { id, dept };
    setDeptCoordinatorRows(newRows);
  };

  const addAuditProfessorRow = () => {
    setAuditProfessorRows([...auditProfessorRows, {id: ""}]);
  };

  const removeAuditProfessorRow = (index: number) => {
    setAuditProfessorRows(auditProfessorRows.filter((_, i) => i !== index));
  };

  const updateAuditProfessorRow = (index: number, value: string) => {
    const newRows = [...auditProfessorRows];
    newRows[index].id = value;
    setAuditProfessorRows(newRows);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId || !semesterId) {
      setError("Please select a course and semester.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await updateCourseOffering(offering.offering_id, {
        course_id: courseId,
        semester_id: semesterId,
        primary_coordinator_id: primaryCoordinatorId ? parseInt(primaryCoordinatorId) : null,
        dept_coordinator_ids: deptCoordinatorRows
          .filter((r) => r.id !== "" && r.dept !== "")
          .map((r) => ({ faculty_id: parseInt(r.id, 10), department_id: r.dept })),
        audit_professor_ids: auditProfessorRows.filter(r => r.id).map(r => parseInt(r.id)),
      });
      router.push("/admin/offerings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this offering? This action cannot be undone.")) return;
    setLoading(true);
    try {
      await deleteCourseOffering(offering.offering_id);
      router.push("/admin/offerings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete offering.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
            Edit Course Offering
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            Update offering details or assign a new coordinator.
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
          title="Delete Offering"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="panel-card space-y-5 p-5"
      >
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
            Select Course
          </label>
          <SearchableSelect
            options={courseOptions}
            value={courseId}
            onChange={setCourseId}
            placeholder="Search by course code or name..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
            Select Semester
          </label>
          <SearchableSelect
            options={semesterOptions}
            value={semesterId}
            onChange={setSemesterId}
            placeholder="Search semester..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
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
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
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
              className="inline-flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent)]/80 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Dept Coordinator
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
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
              className="inline-flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent)]/80 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Audit Professor
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-[var(--color-ink)] px-6 py-2 text-sm font-medium text-white hover:bg-[var(--color-ink)]/80 disabled:opacity-50 transition-colors"
          >
            {loading ? "Updating..." : "Update Offering"}
          </button>
          <a
            href="/admin/offerings"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
