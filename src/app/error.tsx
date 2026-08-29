"use client";

export default function Error({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">
        System alert
      </p>
      <h1 className="text-3xl font-semibold text-[var(--color-ink)]">
        We could not load the vault.
      </h1>
      <p className="text-sm text-[var(--color-muted)]">
        Refresh the page or try again in a moment.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-full bg-[var(--color-ink)] px-6 py-2 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
