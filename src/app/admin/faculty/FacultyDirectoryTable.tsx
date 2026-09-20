"use client";

import { useState, useTransition, useEffect } from "react";
import { Pencil, X, Check, AlertTriangle, Loader2, Building2, ShieldAlert } from "lucide-react";
import { updateFaculty, type Faculty } from "../actions";

type Department = { department_id: string; department_name: string };

const ALL_ROLES = [
  "admin",
  "hod",
  "main_coordinator",
  "dept_coordinator",
  "faculty",
  "audit",
  "developer",
] as const;

const roleBadge: Record<string, { label: string; classes: string }> = {
  admin: { label: "Admin", classes: "bg-slate-100 text-slate-700 ring-slate-700/10" },
  hod: { label: "HOD", classes: "bg-purple-50 text-purple-700 ring-purple-700/10" },
  main_coordinator: { label: "Main Coord.", classes: "bg-[var(--color-accent)]/10 text-[var(--color-accent)] ring-[var(--color-accent)]/20" },
  dept_coordinator: { label: "Dept Coord.", classes: "bg-blue-50 text-blue-700 ring-blue-700/10" },
  faculty: { label: "Faculty", classes: "bg-gray-50 text-gray-700 ring-gray-700/10" },
  audit: { label: "Audit", classes: "bg-amber-50 text-amber-700 ring-amber-700/10" },
  developer: { label: "Developer", classes: "bg-emerald-50 text-emerald-700 ring-emerald-700/10" },
};

type EditState = {
  faculty_name: string;
  designation: string;
  email: string;
  mobile_no: string;
  role: string;
  department_id: string;
};

// ── Confirmation Modal ───────────────────────────────────────────────────────
function ConfirmModal({
  open,
  facultyName,
  originalRole,
  newRole,
  originalDept,
  newDept,
  errorMsg,
  saving,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  facultyName: string;
  originalRole: string;
  newRole: string;
  originalDept: string | null;
  newDept: string | null;
  errorMsg: string | null;
  saving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, saving, onCancel]);

  if (!open) return null;

  const roleChanged = originalRole !== newRole;
  const deptChanged = originalDept !== newDept;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={!saving ? onCancel : undefined}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)] overflow-hidden animate-[fadeInScale_0.18s_ease]">
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-gray-100">
          <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-amber-100">
            <ShieldAlert className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--color-ink)]">
              Confirm changes
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              You are about to update{" "}
              <span className="font-semibold text-gray-700">{facultyName}</span>
            </p>
          </div>
          {!saving && (
            <button
              onClick={onCancel}
              className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {roleChanged && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
              <span className="text-amber-800">
                <strong>Role</strong> will change from{" "}
                <code className="bg-amber-100 px-1 rounded">{roleBadge[originalRole]?.label ?? originalRole}</code>{" "}
                →{" "}
                <code className="bg-amber-100 px-1 rounded">{roleBadge[newRole]?.label ?? newRole}</code>.
                This affects portal access immediately.
              </span>
            </div>
          )}

          {deptChanged && (
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3.5 py-2.5 text-xs">
              <Building2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
              <span className="text-blue-800">
                <strong>Department</strong> will change from{" "}
                <code className="bg-blue-100 px-1 rounded">{originalDept ?? "None"}</code>{" "}
                →{" "}
                <code className="bg-blue-100 px-1 rounded">{newDept ?? "None"}</code>.
              </span>
            </div>
          )}

          {!roleChanged && !deptChanged && (
            <p className="text-xs text-gray-500">
              Basic details (name, email, mobile, designation) will be updated.
            </p>
          )}

          {errorMsg && (
            <p className="text-xs text-red-600 font-medium rounded-lg bg-red-50 border border-red-200 px-3 py-2">
              ⚠ {errorMsg}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onCancel}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {saving ? "Saving…" : "Confirm & Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Table ───────────────────────────────────────────────────────────────
export function FacultyDirectoryTable({
  faculty,
  departments,
}: {
  faculty: Faculty[];
  departments: Department[];
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // The original faculty row being edited (for change diffs in modal)
  const originalFaculty = faculty.find((f) => f.faculty_id === editingId) ?? null;

  function startEdit(f: Faculty) {
    setEditingId(f.faculty_id);
    setShowModal(false);
    setErrorMsg(null);
    setEditState({
      faculty_name: f.faculty_name,
      designation: f.designation ?? "",
      email: f.email,
      mobile_no: f.mobile_no ?? "",
      role: f.role,
      department_id: f.department_id ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState(null);
    setShowModal(false);
    setErrorMsg(null);
  }

  function requestSave() {
    setErrorMsg(null);
    setShowModal(true);
  }

  function confirmSave() {
    if (!editingId || !editState) return;
    setErrorMsg(null);

    startTransition(async () => {
      try {
        await updateFaculty(editingId, {
          faculty_name: editState.faculty_name,
          designation: editState.designation,
          email: editState.email,
          mobile_no: editState.mobile_no,
          role: editState.role,
          department_id: editState.department_id || null,
        });
        setEditingId(null);
        setEditState(null);
        setShowModal(false);
      } catch (e: any) {
        setErrorMsg(e.message ?? "Failed to save changes.");
        // keep modal open so user sees the error
      }
    });
  }

  // Department name lookups
  const deptName = (id: string | null | undefined) =>
    departments.find((d) => d.department_id === id)?.department_name ?? null;

  return (
    <>
      {/* Confirmation Modal */}
      <ConfirmModal
        open={showModal}
        facultyName={editState?.faculty_name ?? ""}
        originalRole={originalFaculty?.role ?? ""}
        newRole={editState?.role ?? ""}
        originalDept={deptName(originalFaculty?.department_id)}
        newDept={deptName(editState?.department_id || null)}
        errorMsg={errorMsg}
        saving={isPending}
        onConfirm={confirmSave}
        onCancel={() => {
          if (!isPending) setShowModal(false);
        }}
      />

      <div className="panel-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/70 text-gray-500 font-medium border-b border-black/5">
            <tr>
              <th className="px-5 py-4">ID</th>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Designation</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Mobile</th>
              <th className="px-5 py-4">Department</th>
              <th className="px-5 py-4">Role</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {faculty.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  No faculty found.
                </td>
              </tr>
            ) : (
              faculty.map((f) => {
                const isEditing = editingId === f.faculty_id;
                const badge = roleBadge[f.role] ?? roleBadge.faculty;

                if (isEditing && editState) {
                  return (
                    <tr
                      key={f.faculty_id}
                      className="bg-blue-50/40 border-l-4 border-[var(--color-accent)]"
                    >
                      <td className="px-5 py-3 text-gray-500 font-mono text-xs">
                        {f.faculty_id}
                      </td>
                      <td className="px-5 py-3">
                        <input
                          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                          value={editState.faculty_name}
                          onChange={(e) => setEditState({ ...editState, faculty_name: e.target.value })}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <input
                          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                          value={editState.designation}
                          onChange={(e) => setEditState({ ...editState, designation: e.target.value })}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="email"
                          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                          value={editState.email}
                          onChange={(e) => setEditState({ ...editState, email: e.target.value })}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <input
                          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                          value={editState.mobile_no}
                          onChange={(e) => setEditState({ ...editState, mobile_no: e.target.value })}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <select
                          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                          value={editState.department_id}
                          onChange={(e) => setEditState({ ...editState, department_id: e.target.value })}
                        >
                          <option value="">— None —</option>
                          {departments.map((d) => (
                            <option key={d.department_id} value={d.department_id}>
                              {d.department_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <select
                          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                          value={editState.role}
                          onChange={(e) => setEditState({ ...editState, role: e.target.value })}
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {roleBadge[r]?.label ?? r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={requestSave}
                            className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={f.faculty_id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{f.faculty_id}</td>
                    <td className="px-5 py-3 font-medium text-[var(--color-ink)]">{f.faculty_name}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{f.designation}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{f.email}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{f.mobile_no || "—"}</td>
                    <td className="px-5 py-3 text-xs">
                      {f.department_name ? (
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          {f.department_name}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => startEdit(f)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)]"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
