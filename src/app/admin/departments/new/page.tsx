"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDepartment } from "../../actions";

export default function NewDepartmentPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createDepartment(formData);
      router.push("/admin/departments");
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
          Add Department
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Create a new academic department.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="panel-card space-y-4 p-5"
      >
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
            Department Name
          </label>
          <input
            name="department_name"
            required
            placeholder="e.g. Computer Science"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
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
            {loading ? "Creating..." : "Create Department"}
          </button>
          <a
            href="/admin/departments"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
