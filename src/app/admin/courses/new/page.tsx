"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourse } from "../../actions";

export default function NewCoursePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createCourse(formData);
      router.push("/admin/courses");
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
          Add New Course
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Create a course in the master list. It can then be offered in any semester.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="panel-card space-y-4 p-5"
      >
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
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
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
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
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
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
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
            Course Type (Optional)
          </label>
          <input
            name="course_type"
            maxLength={2}
            placeholder="e.g. T, L, EL"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] uppercase"
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
            {loading ? "Creating..." : "Create Course"}
          </button>
          <a
            href="/admin/courses"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
