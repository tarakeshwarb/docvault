"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createFaculty } from "../../actions";

export default function NewFacultyPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createFaculty(formData);
      router.push("/admin/faculty");
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
          Add Faculty Member
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Register a new faculty member into the system.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="panel-card space-y-4 p-5"
      >
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
            Faculty ID / Employee ID
          </label>
          <input
            name="faculty_id"
            type="number"
            required
            placeholder="e.g. 100123"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
            Faculty Name
          </label>
          <input
            name="faculty_name"
            required
            placeholder="e.g. Dr. Jane Doe"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
            Designation
          </label>
          <input
            name="designation"
            required
            placeholder="e.g. Assistant Professor"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
            Email Address
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="e.g. janedoe@srmist.edu.in"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
            System Role
          </label>
          <select
            name="role"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
          >
            <option value="admin">Admin</option>
            <option value="hod">HOD</option>
            <option value="faculty">Faculty</option>
            <option value="course_coordinator">Course Coordinator</option>
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
            {loading ? "Creating..." : "Create Faculty"}
          </button>
          <a
            href="/admin/faculty"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
