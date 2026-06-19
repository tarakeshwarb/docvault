"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2, Check } from "lucide-react";
import { exportToExcel, type ExportRequest } from "@/lib/export-client";

type Variant = "solid" | "light";

/**
 * Reusable "Export to Excel" button. Pass a `build` function that returns the
 * export payload at click time (so it always uses the latest filtered data).
 */
export function ExcelExportButton({
  build,
  label = "Export to Excel",
  variant = "light",
  disabled = false,
}: {
  build: () => ExportRequest;
  label?: string;
  variant?: Variant;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    setDone(false);
    try {
      await exportToExcel(build());
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setLoading(false);
    }
  }

  const base =
    "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
  const styles =
    variant === "solid"
      ? "bg-[var(--color-accent)] text-white hover:brightness-110"
      : "bg-white text-[var(--color-ink)] hover:bg-gray-50 ring-1 ring-black/5";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={`${base} ${styles}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : done ? (
          <Check className="h-4 w-4" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        {loading ? "Preparing…" : done ? "Downloaded" : label}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
