"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourseOffering } from "../../actions";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Plus, X } from "lucide-react";

type Course = { course_id: string; course_code: string; course_name: string; year_of_study: number | null };
type Semester = { semester_id: string; semester_name: string; year_name: string };
type Faculty = { faculty_id: number; faculty_name: string; designation: string; role: string };

export default function NewOfferingClient({
  courses,
  semesters,
  coordinators,
}: {
  courses: Course[];
  semesters: Semester[];
  coordinators: Faculty[];
}) {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [primaryCoordinatorId, setPrimaryCoordinatorId] = useState("");
  const [secondaryCoordinatorRows, setSecondaryCoordinatorRows] = useState<{id: string}[]>([{id: ""}]);
  const [auditProfessorRows, setAuditProfessorRows] = useState<{id: string}[]>([{id: ""}]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [yearFilter, setYearFilter] = useState<string>("all");

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
      label: `${f.faculty_name} · ${f.designation}`,
    })),
  ];

  const secondaryCoordinatorOptions = coordinators
    .filter(f => String(f.faculty_id) !== primaryCoordinatorId)
    .map((f) => ({
      value: String(f.faculty_id),
      label: `${f.faculty_name} · ${f.designation}`,
    }));

  const auditProfessorOptions = coordinators.map((f) => ({
    value: String(f.faculty_id),
    label: `${f.faculty_name} · ${f.designation}`,
  }));

  const addSecondaryCoordinatorRow = () => {
    setSecondaryCoordinatorRows([...secondaryCoordinatorRows, {id: ""}]);
  };

  const removeSecondaryCoordinatorRow = (index: number) => {
    setSecondaryCoordinatorRows(secondaryCoordinatorRows.filter((_, i) => i !== index));
  };

  const updateSecondaryCoordinatorRow = (index: number, value: string) => {
    const newRows = [...secondaryCoordinatorRows];
    newRows[index].id = value;
    setSecondaryCoordinatorRows(newRows);
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
      await createCourseOffering({
        course_id: courseId,
        semester_id: semesterId,
        primary_coordinator_id: primaryCoordinatorId ? parseInt(primaryCoordinatorId) : null,
        secondary_coordinator_ids: secondaryCoordinatorRows.filter(r => r.id).map(r => parseInt(r.id)),
        audit_professor_ids: auditProfessorRows.filter(r => r.id).map(r => parseInt(r.id)),
      });
      router.push("/admin/offerings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          New Course Offering
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Offer a course in a specific semester and optionally assign a coordinator.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="panel-card space-y-5 p-5"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
          <div className="w-full sm:w-1/3">
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
              Filter by Year
            </label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none transition hover:border-black/20 focus:border-[var(--color-ink)] focus:ring-1 focus:ring-[var(--color-ink)] bg-white h-10"
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
            Primary Coordinator <span className="text-gray-400 font-normal">(optional)</span>
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
            Secondary Coordinators <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="space-y-2">
            {secondaryCoordinatorRows.map((row, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <SearchableSelect
                    options={secondaryCoordinatorOptions}
                    value={row.id}
                    onChange={(value) => updateSecondaryCoordinatorRow(index, value)}
                    placeholder="Search faculty..."
                  />
                </div>
                {secondaryCoordinatorRows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSecondaryCoordinatorRow(index)}
                    className="inline-flex items-center justify-center rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addSecondaryCoordinatorRow}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent)]/80 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Secondary Coordinator
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
            Audit Professors <span className="text-gray-400 font-normal">(optional)</span>
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
                {auditProfessorRows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAuditProfessorRow(index)}
                    className="inline-flex items-center justify-center rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
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
            {loading ? "Creating..." : "Create Offering"}
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
