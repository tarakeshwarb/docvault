import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { formatBytes, formatDate } from "@/lib/utils";
import { getDocumentById } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const document = await getDocumentById(params.id);

  if (!document) {
    notFound();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/faculty"
          className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-muted)]"
        >
          Back to dashboard
        </Link>

        <div className="rounded-[28px] border border-black/5 bg-white/85 p-6 shadow-[0_20px_60px_rgba(12,10,8,0.08)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                {document.category || "Uncategorized"}
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
                {document.title}
              </h1>
              {document.description ? (
                <p className="mt-3 text-sm text-[var(--color-muted)]">
                  {document.description}
                </p>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)] sm:mt-0">
              <span>{formatDate(document.uploaded_at)}</span>
              <span>{formatBytes(document.file_size)}</span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white/80 p-4 shadow-[0_20px_60px_rgba(12,10,8,0.08)]">
          <iframe
            title={document.title}
            src={document.pdf_url}
            className="h-[70vh] w-full rounded-[22px] border border-black/10"
          />
        </div>

        <div className="rounded-[22px] border border-black/5 bg-white/70 p-4 text-sm text-[var(--color-muted)]">
          If the PDF does not load, confirm the R2 bucket is public or use a
          signed URL.
        </div>
      </div>
    </AppShell>
  );
}
