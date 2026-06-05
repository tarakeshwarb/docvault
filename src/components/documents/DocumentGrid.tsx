"use client";

import type { DocumentRecord } from "@/types/document";
import DocumentCard from "./DocumentCard";

export default function DocumentGrid({
  documents,
}: {
  documents: DocumentRecord[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {documents.map((document) => (
        <DocumentCard key={document.id} document={document} />
      ))}
    </div>
  );
}
