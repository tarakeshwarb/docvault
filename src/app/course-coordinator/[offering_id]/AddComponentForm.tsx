"use client";

import { useState } from "react";
import { addCourseComponent, createCustomComponent } from "../actions";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PlusCircle, Loader2 } from "lucide-react";

type ComponentMaster = { component_id: string; component_name: string };

export function AddComponentForm({
  offering_id,
  componentMasters,
}: {
  offering_id: string;
  componentMasters: ComponentMaster[];
}) {
  const [componentId, setComponentId] = useState("");
  const [customName, setCustomName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [mandatory, setMandatory] = useState(true);
  const [isCommon, setIsCommon] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"existing" | "custom">("existing");

  const componentOptions = componentMasters.map((c) => ({
    value: c.component_id,
    label: c.component_name,
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let finalComponentId = componentId;
      if (mode === "custom") {
        if (!customName.trim()) {
          setError("Please enter a component name.");
          setLoading(false);
          return;
        }
        finalComponentId = await createCustomComponent(customName.trim());
      }

      if (!finalComponentId) {
        setError("Please select or enter a component.");
        setLoading(false);
        return;
      }

      await addCourseComponent({
        offering_id,
        component_id: finalComponentId,
        deadline: deadline || null,
        mandatory,
        is_common: isCommon,
      });

      setComponentId("");
      setCustomName("");
      setDeadline("");
      setMandatory(true);
      setIsCommon(false);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add component.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent)]/80 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Add Requirement
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="panel-card space-y-4 p-5"
        >
          <h3 className="font-semibold text-[var(--color-ink)] text-sm">
            Add Document Requirement
          </h3>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={mode === "existing"}
                onChange={() => setMode("existing")}
                className="accent-[var(--color-accent)]"
              />
              Select from existing components
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={mode === "custom"}
                onChange={() => setMode("custom")}
                className="accent-[var(--color-accent)]"
              />
              Create custom component
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {mode === "existing" ? (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Component</label>
                <SearchableSelect
                  options={componentOptions}
                  value={componentId}
                  onChange={setComponentId}
                  placeholder="Search component..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Custom Component Name
                </label>
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Mid-Semester Feedback"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Deadline <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
              />
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={mandatory}
                  onChange={(e) => setMandatory(e.target.checked)}
                  className="accent-[var(--color-accent)] w-4 h-4"
                />
                Mandatory submission
              </label>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-[var(--color-accent)]/80 transition-colors"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {loading ? "Adding..." : "Add Requirement"}
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
