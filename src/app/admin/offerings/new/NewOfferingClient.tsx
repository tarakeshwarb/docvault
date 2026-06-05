"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourseOffering } from "../../actions";
import { SearchableSelect } from "@/components/ui/searchable-select";

type Course = { course_id: string; course_code: string; course_name: string };
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
  const [coordinatorId, setCoordinatorId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        coordinator_id: coordinatorId ? parseInt(coordinatorId) : null,
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
        className="space-y-5 rounded-xl border border-black/5 bg-white p-5 shadow-sm"
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
            Assign Coordinator <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <SearchableSelect
            options={coordinatorOptions}
            value={coordinatorId}
            onChange={setCoordinatorId}
            placeholder="Search faculty by name or employee ID..."
          />
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
