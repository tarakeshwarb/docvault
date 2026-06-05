"use client";

export default function EmptyState({ query }: { query: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-black/10 bg-white/70 p-10 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-muted)]">
        Nothing here yet
      </p>
      <h3 className="mt-3 text-2xl font-semibold text-[var(--color-ink)]">
        {query
          ? "No results match your search."
          : "Upload your first credential to get started."}
      </h3>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Add PDFs to keep policies, certifications, and audit docs ready on demand.
      </p>
    </div>
  );
}
