"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, Users, Loader2, Search } from "lucide-react";
import { setComponentReviewers } from "../actions";
import { useRouter } from "next/navigation";

export function ManageReviewersModal({
  isOpen,
  onClose,
  componentId,
  componentName,
  assignedReviewers,
  allFaculty,
  globalAllFaculty = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  componentId: string;
  componentName: string;
  assignedReviewers: number[];
  allFaculty: { faculty_id: number; faculty_name: string; email: string }[];
  globalAllFaculty?: { faculty_id: number; faculty_name: string }[];
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>(assignedReviewers);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(assignedReviewers);
      setSearch("");
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const filtered = allFaculty.filter(f =>
    f.faculty_name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(x => x !== id));
    } else {
      if (selectedIds.length >= 2) {
        alert("You can only assign up to 2 verifying faculties per component.");
        return;
      }
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await setComponentReviewers(componentId, selectedIds);
        router.refresh();
        onClose();
      } catch (err: any) {
        alert(err.message || "Failed to save reviewers");
      }
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !isPending && onClose()}
      />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 bg-gray-50/60">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--color-accent)]" />
            <div>
              <h2 className="font-semibold text-sm text-[var(--color-ink)]">Assign Reviewers</h2>
              <p className="text-[11px] text-gray-500 truncate max-w-[200px]">{componentName}</p>
            </div>
          </div>
          <button
            onClick={() => !isPending && onClose()}
            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-500">
            Select up to <strong>2 faculty</strong> from this course to verify submissions for this component.
          </p>

          {/* Selected badges */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedIds.map(id => {
                const f = allFaculty.find(x => Number(x.faculty_id) === Number(id))
                  || (globalAllFaculty.length > 0 ? globalAllFaculty.find(x => Number(x.faculty_id) === Number(id)) : null);
                if (!f) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-medium border border-[var(--color-accent)]/20"
                  >
                    {f.faculty_name.split(" ").slice(0, 3).join(" ")}
                    <button onClick={() => toggleSelection(id)} className="hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search faculty..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          {/* Faculty list */}
          <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4">No faculty found.</p>
            ) : (
              filtered.map(f => {
                const isSelected = selectedIds.some(sid => Number(sid) === Number(f.faculty_id));
                const isDisabled = !isSelected && selectedIds.length >= 2;
                return (
                  <button
                    key={f.faculty_id}
                    onClick={() => !isDisabled && toggleSelection(f.faculty_id)}
                    disabled={isDisabled}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/8"
                        : isDisabled
                        ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
                        : "border-gray-200 hover:border-[var(--color-accent)]/40 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-800">{f.faculty_name}</span>
                    {isSelected && (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50/60 border-t border-black/5">
          <span className="text-xs text-gray-400">{selectedIds.length}/2 selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => !isPending && onClose()}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 rounded-lg transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
