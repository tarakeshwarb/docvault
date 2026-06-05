"use client";

export default function SearchBar({
  action,
  pending,
  query,
  error,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  query: string;
  error?: string;
}) {
  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          key={query}
          name="query"
          type="text"
          defaultValue={query}
          placeholder="Search titles, categories, or keywords"
          className="h-12 flex-1 rounded-full border border-black/10 bg-white px-4 text-sm text-[var(--color-ink)] shadow-sm outline-none transition focus:border-[var(--color-accent)]"
        />
        <button
          type="submit"
          className="h-12 rounded-full bg-[var(--color-ink)] px-6 text-sm font-semibold text-white transition hover:translate-y-[-1px]"
        >
          {pending ? "Searching..." : "Search"}
        </button>
      </div>
      {error ? (
        <p className="text-sm text-[var(--color-accent)]">{error}</p>
      ) : null}
    </form>
  );
}
