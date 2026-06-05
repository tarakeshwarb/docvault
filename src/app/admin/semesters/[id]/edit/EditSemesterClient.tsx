"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Semester, updateSemester } from "../../actions";
import { AcademicYear } from "../../../academic-years/actions";

export default function EditSemesterClient({
  semester,
  years,
}: {
  semester: Semester;
  years: AcademicYear[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      semester_name: formData.get("semester_name") as string,
      year_id: formData.get("year_id") as string,
      is_active: formData.get("is_active") === "on",
    };

    if (!data.semester_name || !data.year_id) {
      setError("Semester name and year are required");
      setLoading(false);
      return;
    }

    try {
      await updateSemester(semester.semester_id, data);
      router.push("/admin/semesters");
    } catch (err) {
      setError("Failed to update semester");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          Edit Semester
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Update the details for this semester.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-black/5 bg-white p-5 shadow-sm"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-ink)]">Semester Name</label>
          <input
            name="semester_name"
            defaultValue={semester.semester_name}
            placeholder="e.g., Odd Semester"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none transition hover:border-black/20 focus:border-[var(--color-ink)] focus:ring-1 focus:ring-[var(--color-ink)]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-ink)]">Academic Year</label>
          <select
            name="year_id"
            defaultValue={semester.year_id}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none transition hover:border-black/20 focus:border-[var(--color-ink)] focus:ring-1 focus:ring-[var(--color-ink)] bg-white"
          >
            <option value="">Select an academic year...</option>
            {years.map((y) => (
              <option key={y.year_id} value={y.year_id}>
                {y.year_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            name="is_active"
            id="is_active"
            defaultChecked={semester.is_active}
            className="rounded border-gray-300 text-[var(--color-ink)] focus:ring-[var(--color-ink)]"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-[var(--color-ink)]">
            Set as active semester
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-[var(--color-ink)] px-6 py-2 text-sm font-medium text-white hover:bg-[var(--color-ink)]/80 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <a
            href="/admin/semesters"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
