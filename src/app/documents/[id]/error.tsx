"use client";

export default function Error({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-black/10 bg-white/70 p-10 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">
          Something went wrong
        </p>
        <h2 className="text-2xl font-semibold text-[var(--color-ink)]">
          We could not load this document.
        </h2>
        <button
          onClick={() => reset()}
          className="rounded-full bg-[var(--color-ink)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-80"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
