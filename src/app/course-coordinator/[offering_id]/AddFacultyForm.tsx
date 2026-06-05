"use client";

import { useState } from "react";
import { addFacultyAssignments } from "../actions";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { UserPlus, Loader2 } from "lucide-react";

type Faculty = { faculty_id: number; faculty_name: string; designation: string };
type Section = { section_id: string; section_name: string };

export function AddFacultyForm({
  offering_id,
  allFaculty,
  allSections,
}: {
  offering_id: string;
  allFaculty: Faculty[];
  allSections: Section[];
}) {
  const [facultyId, setFacultyId] = useState("");
  const [sectionIds, setSectionIds] = useState<string[]>([]);
  const [studentCount, setStudentCount] = useState("60");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const facultyOptions = allFaculty.map((f) => ({
    value: String(f.faculty_id),
    label: `${f.faculty_name} · ${f.designation} · ${f.faculty_id}`,
  }));

  const sectionOptions = allSections.map((s) => ({
    value: s.section_id,
    label: `Sec ${s.section_name}`,
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!facultyId) {
      setError("Please select a faculty member.");
      return;
    }
    if (sectionIds.length === 0) {
      setError("Please select at least one section.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await addFacultyAssignments({
        offering_id,
        faculty_id: parseInt(facultyId),
        section_ids: sectionIds,
        student_count: parseInt(studentCount) || 60,
      });

      setFacultyId("");
      setSectionIds([]);
      setStudentCount("60");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add faculty.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-ink)]/80 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Assign Faculty
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-black/5 bg-white p-5 shadow-sm space-y-4"
        >
          <h3 className="font-semibold text-[var(--color-ink)] text-sm">Assign Faculty to Section</h3>

          <div className="grid gap-4 sm:grid-cols-5">
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Faculty Member</label>
              <SearchableSelect
                options={facultyOptions}
                value={facultyId}
                onChange={setFacultyId}
                placeholder="Search by name..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Sections</label>
              <SearchableMultiSelect
                options={sectionOptions}
                values={sectionIds}
                onChange={setSectionIds}
                placeholder="Search and select sections..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Student Count</label>
              <input
                type="number"
                value={studentCount}
                onChange={(e) => setStudentCount(e.target.value)}
                min={1}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-[var(--color-ink)]/80 transition-colors"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {loading ? "Assigning..." : "Confirm Assignment"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
