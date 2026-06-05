import Link from "next/link";
import type { DocumentRecord } from "@/types/document";
import { formatDate } from "@/lib/utils";

export default function DocumentList({
  documents,
  emptyMessage = "No documents available yet.",
}: {
  documents: DocumentRecord[];
  emptyMessage?: string;
}) {
  if (documents.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-black/10 bg-white/70 px-4 py-3 text-sm text-[var(--color-muted)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <Link
          key={document.id}
          href={`/documents/${document.id}`}
          className="flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white/80 px-4 py-3 text-sm transition hover:border-black/10"
        >
          <div>
            <p className="font-semibold text-[var(--color-ink)]">
              {document.title}
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              {document.category || "Uncategorized"}
            </p>
          </div>
          <span className="text-xs text-[var(--color-muted)]">
            {formatDate(document.uploaded_at)}
          </span>
        </Link>
      ))}
    </div>
  );
}
