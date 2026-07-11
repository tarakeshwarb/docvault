"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Pencil, Trash2, X, Save, Loader2, Upload, Download, Users } from "lucide-react";
import {
  updateCourseComponent,
  deleteCourseComponent,
  setCommonComponentFile,
  removeCommonComponentFile,
} from "../actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/utils";

type CourseComponent = {
  id: string;
  component_name: string;
  mandatory: boolean;
  deadline: string | null;
  is_common: boolean;
  common_file_key: string | null;
  common_file_name: string | null;
};

export function EditableComponentRow({
  comp,
  offering_id,
  currentFacultyId,
  baseUrl,
}: {
  comp: CourseComponent;
  offering_id: string;
  currentFacultyId?: number;
  baseUrl?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [mandatory, setMandatory] = useState(comp.mandatory);
  const [deadline, setDeadline] = useState(
    comp.deadline ? new Date(comp.deadline).toISOString().slice(0, 16) : ""
  );
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Common-file state
  const [fileKey, setFileKey] = useState(comp.common_file_key);
  const [fileName, setFileName] = useState(comp.common_file_name);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSave() {
    setLoading(true);
    try {
      await updateCourseComponent({ id: comp.id, offering_id, mandatory, deadline: deadline || null });
      setIsEditing(false);
    } catch {
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
    } catch {
      alert("Failed to delete component");
      setLoading(false);
    }
  }

  async function handleCommonUpload(file: File) {
    setUploading(true);
    setFileError(null);
    try {
      const res = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: file.name, content_type: file.type, component_id: comp.id }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to get upload URL");
      }
      const { upload_url, r2_object_key, dev_mode } = await res.json();
      if (!dev_mode) {
        const put = await fetch(upload_url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        if (!put.ok) throw new Error("Upload to storage failed");
      }
      await setCommonComponentFile({
        course_component_id: comp.id,
        offering_id,
        r2_object_key,
        file_name: file.name,
        uploaded_by: currentFacultyId ?? 0,
      });
      setFileKey(r2_object_key);
      setFileName(file.name);
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleCommonRemove() {
    if (!fileKey) return;
    setUploading(true);
    setFileError(null);
    try {
      await removeCommonComponentFile({ course_component_id: comp.id, offering_id, r2_object_key: fileKey });
      setFileKey(null);
      setFileName(null);
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "Failed to remove.");
    } finally {
      setUploading(false);
    }
  }

  const commonControl = comp.is_common ? (
    <div className="mt-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png,.zip"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleCommonUpload(f);
        }}
      />
      {fileKey ? (
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`${baseUrl ?? ""}/${fileKey}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20"
          >
            <Download className="w-3 h-3" /> {fileName ?? "View file"}
          </a>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs font-medium text-gray-500 hover:text-gray-800 disabled:opacity-50"
          >
            Replace
          </button>
          <button
            onClick={handleCommonRemove}
            disabled={uploading}
            className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            Remove
          </button>
          {uploading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          Upload common file
        </button>
      )}
      {fileError && <p className="mt-1 text-xs text-red-500">{fileError}</p>}
    </div>
  ) : null;

  const nameCell = (
    <>
      <div className="flex items-center gap-2">
        <span>{comp.component_name}</span>
        {comp.is_common && (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-600 ring-1 ring-inset ring-indigo-600/10">
            <Users className="w-3 h-3" /> Common
          </span>
        )}
      </div>
      {commonControl}
    </>
  );

  if (isEditing) {
    return (
      <tr className="bg-[var(--color-accent)]/5">
        <td className="px-5 py-3 font-medium text-[var(--color-ink)]">{nameCell}</td>
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
      <td className="px-5 py-3 font-medium text-[var(--color-ink)]">{nameCell}</td>
      <td className="px-5 py-3 text-center">
        {comp.mandatory ? (
          <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)] inline" />
        ) : (
          <span className="text-xs text-gray-400">Optional</span>
        )}
      </td>
      <td className="px-5 py-3 text-gray-500 text-xs">
        {comp.is_common ? "—" : comp.deadline ? formatDate(comp.deadline) : "No deadline"}
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
