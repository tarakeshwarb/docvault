"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Course, updateCourse } from "../../../actions";

export default function EditCourseClient({ course }: { course: Course }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      course_code: formData.get("course_code") as string,
      course_name: formData.get("course_name") as string,
      credits: parseInt(formData.get("credits") as string),
    };

    if (!data.course_code || !data.course_name || isNaN(data.credits)) {
      setError("Course code, name, and valid credits are required");
      setLoading(false);
      return;
    }

    try {
      await updateCourse(course.course_id, data);
      router.push("/admin/courses");
    } catch (err) {
      setError("Failed to update course");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          Edit Course
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Update the details for this course.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-black/5 bg-white p-5 shadow-sm"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-ink)]">Course Code</label>
          <input
            name="course_code"
            defaultValue={course.course_code}
            placeholder="e.g., CS101"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none transition hover:border-black/20 focus:border-[var(--color-ink)] focus:ring-1 focus:ring-[var(--color-ink)]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-ink)]">Course Name</label>
          <input
            name="course_name"
            defaultValue={course.course_name}
            placeholder="e.g., Introduction to Computer Science"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none transition hover:border-black/20 focus:border-[var(--color-ink)] focus:ring-1 focus:ring-[var(--color-ink)]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-ink)]">Credits</label>
          <input
            type="number"
            name="credits"
            defaultValue={course.credits}
            min="1"
            max="10"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none transition hover:border-black/20 focus:border-[var(--color-ink)] focus:ring-1 focus:ring-[var(--color-ink)]"
          />
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
