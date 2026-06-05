"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { createSemester } from "../../actions";
import { SearchableSelect } from "@/components/ui/searchable-select";

export default function NewSemesterPage({
  academicYearsPromise,
  semestersPromise,
}: {
  academicYearsPromise: Promise<{ year_id: string; year_name: string }[]>;
  semestersPromise: Promise<{
    semester_id: string;
    semester_name: string;
    year_name?: string;
  }[]>;
}) {
  const years = use(academicYearsPromise);
  const semesters = use(semestersPromise);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [yearId, setYearId] = useState("");
  const [semesterName, setSemesterName] = useState("");

  const yearOptions = years.map((year) => ({
    value: year.year_id,
    label: year.year_name,
  }));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createSemester(formData);
      router.push("/admin/semesters");
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
          Add Semester
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Create an Odd or Even semester for a specific academic year.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-black/5 bg-white p-5 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
            Academic Year
          </label>
          <input type="hidden" name="year_id" value={yearId} />
          <SearchableSelect
            options={yearOptions}
            value={yearId}
            onChange={setYearId}
            placeholder="Search academic year..."
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
            Semester Name
          </label>
          <select
            name="semester_name"
            value={semesterName}
            onChange={(event) => setSemesterName(event.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
          >
            <option value="">Select semester type...</option>
            <option value="Odd">Odd Semester</option>
            <option value="Even">Even Semester</option>
          </select>
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
            {loading ? "Creating..." : "Create Semester"}
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
