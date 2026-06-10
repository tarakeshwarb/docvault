"use client";

import { useState } from "react";
import { CheckCircle2, Pencil, Trash2, X, Save, Loader2 } from "lucide-react";
import { updateCourseComponent, deleteCourseComponent } from "../actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/utils";

type CourseComponent = {
  id: string;
  component_name: string;
  mandatory: boolean;
  deadline: string | null;
};

export function EditableComponentRow({
  comp,
  offering_id,
}: {
  comp: CourseComponent;
  offering_id: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [mandatory, setMandatory] = useState(comp.mandatory);
  // Convert ISO string to format suitable for datetime-local if it exists
  const [deadline, setDeadline] = useState(
    comp.deadline ? new Date(comp.deadline).toISOString().slice(0, 16) : ""
  );
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      await updateCourseComponent({
        id: comp.id,
        offering_id,
        mandatory,
        deadline: deadline || null,
      });
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update component");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteCourseComponent({ id: comp.id, offering_id });
      setIsConfirmOpen(false);
    } catch (err) {
      alert("Failed to delete component");
      setLoading(false);
    }
  }

  if (isEditing) {
    return (
      <tr className="bg-[var(--color-accent)]/5">
        <td className="px-5 py-3 font-medium text-[var(--color-ink)]">
          {comp.component_name}
        </td>
        <td className="px-5 py-3 text-center">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={mandatory}
              onChange={(e) => setMandatory(e.target.checked)}
              className="accent-[var(--color-accent)] w-4 h-4"
            />
            <span className="text-sm">Mandatory</span>
          </label>
        </td>
        <td className="px-5 py-3">
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full max-w-[200px] rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-[var(--color-accent)]"
          />
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
                setMandatory(comp.mandatory);
                setDeadline(comp.deadline ? new Date(comp.deadline).toISOString().slice(0, 16) : "");
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
      <td className="px-5 py-3 font-medium text-[var(--color-ink)]">
        {comp.component_name}
      </td>
      <td className="px-5 py-3 text-center">
        {comp.mandatory ? (
          <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)] inline" />
        ) : (
          <span className="text-xs text-gray-400">Optional</span>
        )}
      </td>
      <td className="px-5 py-3 text-gray-500 text-xs">
        {comp.deadline ? formatDate(comp.deadline) : "No deadline"}
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
          title="Remove Component Requirement"
          message={`Are you sure you want to remove the ${comp.component_name} requirement? This will delete any associated submissions.`}
          onConfirm={handleDelete}
          onCancel={() => setIsConfirmOpen(false)}
          isLoading={loading}
        />
      </td>
    </tr>
  );
}
