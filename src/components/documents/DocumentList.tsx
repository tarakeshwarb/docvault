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
      <p className="panel-card border-dashed border-black/10 px-4 py-3 text-sm text-[var(--color-muted)]">
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
          className="panel-card panel-card-hover flex items-center justify-between gap-4 px-4 py-3 text-sm"
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
