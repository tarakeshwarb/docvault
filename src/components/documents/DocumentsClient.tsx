"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  DashboardStats,
  DocumentRecord,
  SearchState,
  UploadState,
} from "@/types/document";
import {
  searchDocuments,
  uploadDocument,
} from "@/app/actions/document-actions";
import DocumentGrid from "./DocumentGrid";
import EmptyState from "./EmptyState";
import SearchBar from "./SearchBar";
import StatsBar from "./StatsBar";
import UploadForm from "./UploadForm";

const buildInitialSearchState = (
  documents: DocumentRecord[]
): SearchState => ({
  query: "",
  results: documents,
});

const initialUploadState: UploadState = {
  ok: true,
  message: "",
};

export default function DocumentsClient({
  initialDocuments,
  stats,
}: {
  initialDocuments: DocumentRecord[];
  stats: DashboardStats;
}) {
  const router = useRouter();
  const [formResetKey, setFormResetKey] = useState(0);

  const [searchState, searchAction, searching] = useActionState(
    searchDocuments,
    buildInitialSearchState(initialDocuments)
  );

  const [uploadState, uploadAction] = useActionState(
    uploadDocument,
    initialUploadState
  );

  useEffect(() => {
    if (uploadState.ok && uploadState.message) {
      setFormResetKey((value) => value + 1);
      router.refresh();
    }
  }, [uploadState, router]);

  const results = searchState.results ?? [];
  const hasResults = results.length > 0;

  return (
    <section className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="panel-card p-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-muted)]">
              Search the vault
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
              Find credentials, policies, and compliance docs in seconds.
            </h2>
          </div>
          <div className="mt-6">
            <SearchBar
              action={searchAction}
              pending={searching}
              query={searchState.query}
              error={searchState.error}
            />
          </div>
        </div>
        <UploadForm
          key={formResetKey}
          action={uploadAction}
          state={uploadState}
        />
      </div>

      <StatsBar stats={stats} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-muted)]">
            Document Grid
          </p>
          <h3 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
            {searchState.query
              ? `Results for "${searchState.query}"`
              : "Latest uploads"}
          </h3>
        </div>
        <div className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-medium text-[var(--color-muted)]">
          {results.length} files
        </div>
      </div>

      {hasResults ? (
        <DocumentGrid documents={results} />
      ) : (
        <EmptyState query={searchState.query} />
      )}
    </section>
  );
}
