"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AcademicYear, updateAcademicYear } from "../../actions";

export default function EditYearClient({ year }: { year: AcademicYear }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format dates for input type="date"
  const startDateStr = year.start_date ? new Date(year.start_date).toISOString().split("T")[0] : "";
  const endDateStr = year.end_date ? new Date(year.end_date).toISOString().split("T")[0] : "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      year_name: formData.get("year_name") as string,
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
    };

    if (!data.year_name) {
      setError("Year name is required");
      setLoading(false);
      return;
    }

    try {
      await updateAcademicYear(year.year_id, data);
      router.push("/admin/academic-years");
    } catch (err) {
      setError("Failed to update academic year");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          Edit Academic Year
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Update the details for this academic year.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="panel-card space-y-5 p-5"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-ink)]">Year Name</label>
          <input
            name="year_name"
            defaultValue={year.year_name}
            placeholder="e.g., 2024-2025"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none transition hover:border-black/20 focus:border-[var(--color-ink)] focus:ring-1 focus:ring-[var(--color-ink)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-ink)]">Start Date</label>
            <input
              type="date"
              name="start_date"
              defaultValue={startDateStr}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none transition hover:border-black/20 focus:border-[var(--color-ink)] focus:ring-1 focus:ring-[var(--color-ink)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-ink)]">End Date</label>
            <input
              type="date"
              name="end_date"
              defaultValue={endDateStr}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none transition hover:border-black/20 focus:border-[var(--color-ink)] focus:ring-1 focus:ring-[var(--color-ink)]"
            />
          </div>
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
            href="/admin/academic-years"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
