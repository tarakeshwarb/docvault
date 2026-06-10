"use client";

import { useState } from "react";
import { Pencil, Trash2, X, Save, Loader2 } from "lucide-react";
import { updateFacultyAssignment, deleteFacultyAssignment } from "../actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type FacultyAssignment = {
  id: string;
  faculty_id: number;
  faculty_name: string;
  designation: string;
  email: string;
  section_id: string;
  section_name: string;
  student_count: number;
};

type Section = {
  section_id: string;
  section_name: string;
};

export function EditableFacultyRow({
  fa,
  allSections,
  submittedCount,
  pendingCount,
  offering_id,
}: {
  fa: FacultyAssignment;
  allSections: Section[];
  submittedCount: number;
  pendingCount: number;
  offering_id: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [sectionId, setSectionId] = useState(fa.section_id);
  const [studentCount, setStudentCount] = useState(String(fa.student_count));
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      await updateFacultyAssignment({
        id: fa.id,
        offering_id,
        section_id: sectionId,
        student_count: parseInt(studentCount) || 0,
      });
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update assignment. A conflict may exist for this section.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteFacultyAssignment({ id: fa.id, offering_id });
      setIsConfirmOpen(false);
    } catch (err) {
      alert("Failed to delete assignment");
      setLoading(false);
    }
  }

  if (isEditing) {
    return (
      <tr className="bg-[var(--color-accent)]/5">
        <td className="px-5 py-3">
          <p className="font-medium text-[var(--color-ink)]">{fa.faculty_name}</p>
          <p className="text-xs text-gray-400">{fa.designation}</p>
        </td>
        <td className="px-5 py-3">
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="w-full max-w-[120px] rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-[var(--color-accent)] bg-white"
          >
            {allSections.map((sec) => (
              <option key={sec.section_id} value={sec.section_id}>
                Section {sec.section_name}
              </option>
            ))}
          </select>
        </td>
        <td className="px-5 py-3 text-center">
          <input
            type="number"
            min="1"
            value={studentCount}
            onChange={(e) => setStudentCount(e.target.value)}
            className="w-20 text-center rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-[var(--color-accent)]"
          />
        </td>
        <td className="px-5 py-3 text-center text-gray-400 text-xs" colSpan={2}>
          Pending edits...
        </td>
        <td className="px-5 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]/80 disabled:opacity-50 transition-colors"
              title="Save"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setSectionId(fa.section_id);
                setStudentCount(String(fa.student_count));
                setIsEditing(false);
              }}
              disabled={loading}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50/50 transition-colors group">
      <td className="px-5 py-3">
        <p className="font-medium text-[var(--color-ink)]">{fa.faculty_name}</p>
        <p className="text-xs text-gray-400">{fa.designation}</p>
      </td>
      <td className="px-5 py-3">
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          Section {fa.section_name}
        </span>
      </td>
      <td className="px-5 py-3 text-center text-gray-600">{fa.student_count}</td>
      <td className="px-5 py-3 text-center">
        <span className="text-[var(--color-accent)] font-semibold">{submittedCount}</span>
      </td>
      <td className="px-5 py-3 text-center">
        <span className={pendingCount > 0 ? "text-[var(--color-accent)] font-semibold" : "text-gray-400"}>
          {pendingCount}
        </span>
      </td>
      <td className="px-5 py-3 text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsConfirmOpen(true)}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>

        <ConfirmDialog
          isOpen={isConfirmOpen}
          title="Remove Faculty Assignment"
          message={`Are you sure you want to remove ${fa.faculty_name} from Section ${fa.section_name}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setIsConfirmOpen(false)}
          isLoading={loading}
        />
      </td>
    </tr>
  );
}
