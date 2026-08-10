"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  getComponentsForOfferingAction,
  getResultAnalysisAction,
  saveResultAnalysisAction,
  createComponentAction,
} from "./result-analysis-actions";
import {
  BarChart3,
  Loader2,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";

const RANGE_LABELS = ["0-49", "50-59", "60-69", "70-79", "80-89", "90-100"];

type ComponentOption = { component_id: string; component_name: string };

export function ResultAnalysisModal({
  offeringId,
  facultyAssignmentId,
  sectionName,
  courseCode,
  courseName,
}: {
  offeringId: string;
  facultyAssignmentId: string;
  sectionName: string;
  courseCode: string;
  courseName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [components, setComponents] = useState<ComponentOption[]>([]);
  const [componentId, setComponentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [strength, setStrength] = useState(0);
  const [absentees, setAbsentees] = useState(0);
  const [ranges, setRanges] = useState<number[]>([0, 0, 0, 0, 0, 0]);

  const [addingOpen, setAddingOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    (async () => {
      setLoading(true);
      try {
        const comps = await getComponentsForOfferingAction(offeringId);
        setComponents(comps);
        if (comps.length && !componentId) setComponentId(comps[0].component_id);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      document.body.style.overflow = "unset";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Reset fields to 0 when the chosen component changes.
  useEffect(() => {
    if (!isOpen || !componentId) return;
    setStrength(0);
    setAbsentees(0);
    setRanges([0, 0, 0, 0, 0, 0]);
    setSavedOk(false);
    setErrors([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId, isOpen]);

  const derived = useMemo(() => {
    const failures = ranges[0] || 0;
    const present = strength - absentees;
    const sum = ranges.reduce((a, b) => a + (Number(b) || 0), 0);
    const passPct = strength > 0 ? ((present - failures) / strength) * 100 : 0;
    return { failures, present, sum, passPct, balanced: sum === present };
  }, [ranges, strength, absentees]);

  function setRange(i: number, value: number) {
    setRanges((prev) => prev.map((v, idx) => (idx === i ? Math.max(0, Math.floor(value || 0)) : v)));
    setSavedOk(false);
  }

  async function handleSave() {
    setSaving(true);
    setErrors([]);
    setSavedOk(false);
    try {
      const res = await saveResultAnalysisAction({
        offering_id: offeringId,
        faculty_assignment_id: facultyAssignmentId,
        component_id: componentId,
        total_strength: strength,
        total_absentees: absentees,
        ranges,
      });
      if (res.ok) setSavedOk(true);
      else setErrors(res.errors);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Failed to save."]);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateComponent() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setErrors([]);
    try {
      const created = await createComponentAction(offeringId, name);
      const comps = await getComponentsForOfferingAction(offeringId);
      setComponents(comps);
      setComponentId(created.component_id);
      setNewName("");
      setAddingOpen(false);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Failed to add component."]);
    } finally {
      setCreating(false);
    }
  }



  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
      >
        <BarChart3 className="w-3 h-3" />
        Result Analysis
      </button>

      {isOpen && typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !saving && setIsOpen(false)}
            />
            <div className="relative z-10 flex max-h-[92vh] w-[95vw] max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-ink)]">Result Analysis</h2>
                  <p className="text-sm text-gray-500">
                    {courseCode} · {courseName} · Section {sectionName}
                  </p>
                </div>
                <button
                  onClick={() => !saving && setIsOpen(false)}
                  className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Component picker */}
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Component
                        </label>
                        <button
                          type="button"
                          onClick={() => setAddingOpen((v) => !v)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
                        >
                          <Plus className="h-3 w-3" /> New component
                        </button>
                      </div>

                      {components.length === 0 ? (
                        <p className="rounded bg-amber-50 p-2 text-xs text-amber-700">
                          No components yet. Add one below (or ask the coordinator to add them).
                        </p>
                      ) : (
                        <select
                          value={componentId}
                          onChange={(e) => setComponentId(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          {components.map((c) => (
                            <option key={c.component_id} value={c.component_id}>
                              {c.component_name}
                            </option>
                          ))}
                        </select>
                      )}

                      {addingOpen && (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleCreateComponent();
                              }
                            }}
                            placeholder="e.g. CT1, FT3, LLT1"
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={handleCreateComponent}
                            disabled={creating || !newName.trim()}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Add
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Strength / absentees */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Total Strength
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={strength}
                          onChange={(e) => {
                            setStrength(Math.max(0, Math.floor(Number(e.target.value) || 0)));
                            setSavedOk(false);
                          }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Total Absentees
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={absentees}
                          onChange={(e) => {
                            setAbsentees(Math.max(0, Math.floor(Number(e.target.value) || 0)));
                            setSavedOk(false);
                          }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    {/* Range grid */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Students per mark range
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {RANGE_LABELS.map((lbl, i) => (
                          <div key={lbl}>
                            <span className="mb-1 block text-center text-xs text-gray-500">{lbl}</span>
                            <input
                              type="number"
                              min={0}
                              value={ranges[i]}
                              onChange={(e) => setRange(i, Number(e.target.value))}
                              className="w-full rounded-lg border border-gray-300 px-2 py-2 text-center text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Live derived + balance check */}
                    <div className="grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-3 text-center">
                      <div>
                        <p className="text-xs text-gray-500">Failures (0-49)</p>
                        <p className="text-lg font-semibold text-gray-900">{derived.failures}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pass %</p>
                        <p className="text-lg font-semibold text-gray-900">{derived.passPct.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Counted / Present</p>
                        <p className={`text-lg font-semibold ${derived.balanced ? "text-green-600" : "text-red-600"}`}>
                          {derived.sum} / {derived.present}
                        </p>
                      </div>
                    </div>

                    {!derived.balanced && (
                      <p className="flex items-center gap-2 rounded bg-red-50 p-2 text-xs font-medium text-red-600">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        The six range counts must add up to present students (strength − absentees).
                      </p>
                    )}
                    {errors.map((e, i) => (
                      <p key={i} className="rounded bg-red-50 p-2 text-xs font-medium text-red-600">
                        {e}
                      </p>
                    ))}
                    {savedOk && (
                      <p className="flex items-center gap-2 rounded bg-green-50 p-2 text-xs font-medium text-green-700">
                        <CheckCircle2 className="h-4 w-4" /> Saved.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-black/5 bg-gray-50/80 px-6 py-4">
                <button
                  onClick={handleSave}
                  disabled={saving || !componentId || !derived.balanced}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-accent)]/90 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}


