"use client";

import { useFormStatus } from "react-dom";
import type { UploadState } from "@/types/document";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 w-full rounded-full bg-[var(--color-accent)] text-sm font-semibold text-white shadow-[0_12px_30px_rgba(213,84,59,0.35)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70 sm:h-12"
    >
      {pending ? "Uploading..." : "Upload PDF"}
    </button>
  );
}

export default function UploadForm({
  action,
  state,
}: {
  action: (formData: FormData) => void;
  state: UploadState;
}) {
  const messageColor = state.ok
    ? "text-[var(--color-accent-2)]"
    : "text-[var(--color-accent)]";

  return (
    <form
      action={action}
      className="rounded-[28px] border border-black/5 bg-white/80 p-5 shadow-[0_20px_60px_rgba(12,10,8,0.08)] sm:p-6"
      encType="multipart/form-data"
    >
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-muted)]">
          Upload a PDF
        </p>
        <h2 className="text-xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-2xl">
          Drop in new credentials and keep the vault current.
        </h2>
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Title
          </label>
          <input
            name="title"
            required
            className="h-10 w-full rounded-full border border-black/10 bg-white px-4 text-sm text-[var(--color-ink)] shadow-sm outline-none transition focus:border-[var(--color-accent)] sm:h-11"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Category
          </label>
          <input
            name="category"
            placeholder="Compliance, HR, Legal"
            className="h-10 w-full rounded-full border border-black/10 bg-white px-4 text-sm text-[var(--color-ink)] shadow-sm outline-none transition focus:border-[var(--color-accent)] sm:h-11"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[var(--color-ink)] shadow-sm outline-none transition focus:border-[var(--color-accent)]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            PDF file
          </label>
          <input
            name="file"
            type="file"
            accept="application/pdf"
            required
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[13px] text-[var(--color-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-ink)] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white sm:text-sm"
          />
          <p className="text-xs text-[var(--color-muted)]">
            Max file size 20 MB. PDFs only.
          </p>
        </div>
        <SubmitButton />
        {state.message ? (
          <p className={`text-sm ${messageColor}`}>{state.message}</p>
        ) : null}
      </div>
    </form>
  );
}
