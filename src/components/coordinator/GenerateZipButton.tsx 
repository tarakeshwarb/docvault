"use client";

import { useState } from "react";
import { Archive, Loader2, CheckCircle2 } from "lucide-react";

export function GenerateZipButton({
  offering_id,
  component_id,
  label,
}: {
  offering_id: string;
  component_id?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setDone(false);

    try {
      const res = await fetch("/api/generate-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offering_id, component_id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate ZIP");
      }

      // Auto-download the ZIP
      const link = document.createElement("a");
      link.href = data.zip_url;
      link.download = `bulk-export.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-accent)]/90 transition-all disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating ZIP...
          </>
        ) : done ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Downloaded!
          </>
        ) : (
          <>
            <Archive className="w-4 h-4" />
            {label ?? "Download All as ZIP"}
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
