"use server";

import { revalidatePath } from "next/cache";
import type { SearchState, UploadState } from "@/types/document";
import {
  buildR2Key,
  deleteFromR2,
  extractR2KeyFromUrl,
  uploadPdfToR2,
} from "@/lib/r2";
import {
  createDocument,
  deleteDocumentById,
  getDocumentById,
  listDocuments,
  searchDocuments as searchDocumentsQuery,
} from "@/lib/supabase/queries";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const parseString = (value: FormDataEntryValue | null): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export async function searchDocuments(
  _prevState: SearchState,
  formData: FormData
): Promise<SearchState> {
  const query = parseString(formData.get("query"));
  if (!query) {
    const results = await listDocuments({ limit: 24 });
    return { query: "", results };
  }

  try {
    const results = await searchDocumentsQuery(query);
    return { query, results };
  } catch (error) {
    return {
      query,
      results: [],
      error: "Search failed. Please try again.",
    };
  }
}

export async function uploadDocument(
  _prevState: UploadState,
  formData: FormData
): Promise<UploadState> {
  const title = parseString(formData.get("title"));
  const description = parseString(formData.get("description")) || null;
  const category = parseString(formData.get("category")) || null;
  const file = formData.get("file");

  if (!title) {
    return { ok: false, message: "Title is required." };
  }

  if (!(file instanceof File)) {
    return { ok: false, message: "Attach a PDF file." };
  }

  if (file.type !== "application/pdf") {
    return { ok: false, message: "Only PDF files are supported." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, message: "PDF must be under 20 MB." };
  }

  let key: string | null = null;

  try {
    key = buildR2Key(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfUrl = await uploadPdfToR2({
      key,
      body: buffer,
      contentType: file.type,
    });

    await createDocument({
      title,
      description,
      category,
      pdf_url: pdfUrl,
      file_name: file.name,
      file_size: file.size,
    });

    revalidatePath("/faculty");
    revalidatePath("/course-coordinator");
    revalidatePath("/admin");

    return { ok: true, message: "Upload complete." };
  } catch (error) {
    if (key) {
      await deleteFromR2(key).catch(() => undefined);
    }
    return { ok: false, message: "Upload failed. Please try again." };
  }
}

export async function deleteDocument(formData: FormData): Promise<void> {
  const id = parseString(formData.get("id"));
  const pdfUrl = parseString(formData.get("pdfUrl"));

  if (!id) {
    return;
  }

  let resolvedUrl = pdfUrl;

  if (!resolvedUrl) {
    const record = await getDocumentById(id);
    resolvedUrl = record?.pdf_url ?? "";
  }

  const key = resolvedUrl ? extractR2KeyFromUrl(resolvedUrl) : null;
  if (key) {
    await deleteFromR2(key);
  }

  await deleteDocumentById(id);

  revalidatePath("/faculty");
  revalidatePath("/course-coordinator");
  revalidatePath("/admin");
  revalidatePath(`/documents/${id}`);
}
