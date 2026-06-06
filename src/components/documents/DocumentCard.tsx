"use client";

import Link from "next/link";
import type { DocumentRecord } from "@/types/document";
import { formatBytes, formatDate } from "@/lib/utils";
import { deleteDocument } from "@/app/actions/document-actions";
import DeleteButton from "./DeleteButton";

export default function DocumentCard({
  document,
}: {
  document: DocumentRecord;
}) {
  const categoryLabel = document.category || "Uncategorized";

  return (
    <div className="panel-card panel-card-hover group relative overflow-hidden p-4 sm:p-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-[var(--color-accent)]/80" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)] sm:text-xs">
            {categoryLabel}
          </p>
          <Link
            href={`/documents/${document.id}`}
            className="mt-2 block text-base font-semibold text-[var(--color-ink)] sm:text-lg"
          >
            {document.title}
          </Link>
        </div>
        <span className="rounded-full bg-[var(--color-accent-2)]/15 px-3 py-1 text-xs font-semibold text-[var(--color-accent-2)]">
          PDF
        </span>
      </div>

      {document.description ? (
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          {document.description}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-muted)]">
        <span>{formatDate(document.uploaded_at)}</span>
        <span>{formatBytes(document.file_size)}</span>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <Link
          href={`/documents/${document.id}`}
          className="text-[13px] font-semibold text-[var(--color-ink)] sm:text-sm"
        >
          Open details
        </Link>
        <form action={deleteDocument}>
          <input type="hidden" name="id" value={document.id} />
          <input type="hidden" name="pdfUrl" value={document.pdf_url} />
          <DeleteButton />
        </form>
      </div>
    </div>
  );
}
