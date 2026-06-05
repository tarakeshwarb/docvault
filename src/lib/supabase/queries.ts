import type {
  DashboardStats,
  DocumentRecord,
  NewDocument,
} from "@/types/document";
import { executeDb, queryDb } from "@/lib/db";
import { randomUUID } from "crypto";

const useDatabase = Boolean(process.env.DATABASE_URL);
const memoryStore: DocumentRecord[] = [];

const toSearchText = (value: string | null) => (value ?? "").toLowerCase();

export async function listDocuments(options?: {
  category?: string | null;
  limit?: number;
}): Promise<DocumentRecord[]> {
  const { category, limit = 50 } = options ?? {};
  if (!useDatabase) {
    const filtered = category
      ? memoryStore.filter((item) => item.category === category)
      : memoryStore.slice();
    return filtered
      .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))
      .slice(0, limit);
  }
  if (category) {
    return queryDb<DocumentRecord>(
      "select * from documents where category = $1 order by uploaded_at desc limit $2",
      [category, limit]
    );
  }
  return queryDb<DocumentRecord>(
    "select * from documents order by uploaded_at desc limit $1",
    [limit]
  );
}

export async function searchDocuments(query: string): Promise<DocumentRecord[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }
  if (!useDatabase) {
    const needle = trimmed.toLowerCase();
    return memoryStore
      .filter((item) => {
        return [item.title, item.description, item.category].some((value) =>
          toSearchText(value).includes(needle)
        );
      })
      .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))
      .slice(0, 50);
  }
  const pattern = `%${trimmed}%`;
  return queryDb<DocumentRecord>(
    "select * from documents where title ilike $1 or description ilike $1 or category ilike $1 order by uploaded_at desc limit 50",
    [pattern]
  );
}

export async function getDocumentById(
  id: string
): Promise<DocumentRecord | null> {
  if (!useDatabase) {
    return memoryStore.find((item) => item.id === id) ?? null;
  }
  const rows = await queryDb<DocumentRecord>(
    "select * from documents where id = $1 limit 1",
    [id]
  );
  return rows[0] ?? null;
}

export async function createDocument(
  payload: NewDocument
): Promise<DocumentRecord> {
  if (!useDatabase) {
    const record: DocumentRecord = {
      id: randomUUID(),
      title: payload.title,
      description: payload.description ?? null,
      category: payload.category ?? null,
      uploaded_at: new Date().toISOString(),
      pdf_url: payload.pdf_url,
      file_name: payload.file_name ?? null,
      file_size: payload.file_size ?? null,
    };
    memoryStore.push(record);
    return record;
  }
  const rows = await queryDb<DocumentRecord>(
    "insert into documents (title, description, category, pdf_url, file_name, file_size) values ($1, $2, $3, $4, $5, $6) returning *",
    [
      payload.title,
      payload.description ?? null,
      payload.category ?? null,
      payload.pdf_url,
      payload.file_name ?? null,
      payload.file_size ?? null,
    ]
  );
  const created = rows[0];
  if (!created) {
    throw new Error("Failed to create document.");
  }
  return created;
}

export async function deleteDocumentById(id: string): Promise<void> {
  if (!useDatabase) {
    const index = memoryStore.findIndex((item) => item.id === id);
    if (index >= 0) {
      memoryStore.splice(index, 1);
    }
    return;
  }
  await executeDb("delete from documents where id = $1", [id]);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!useDatabase) {
    const categories = new Set(
      memoryStore
        .map((item) => item.category)
        .filter((value): value is string => Boolean(value))
    );
    const latestUpload = memoryStore
      .map((item) => item.uploaded_at)
      .sort()
      .reverse()[0];
    return {
      total: memoryStore.length,
      categories: categories.size,
      latestUpload: latestUpload ?? null,
    };
  }
  const totalRows = await queryDb<{ total: number }>(
    "select count(*)::int as total from documents"
  );
  const categoryRows = await queryDb<{ categories: number }>(
    "select count(distinct category)::int as categories from documents where category is not null and category <> ''"
  );
  const latestRows = await queryDb<{ uploaded_at: string }>(
    "select uploaded_at from documents order by uploaded_at desc limit 1"
  );

  return {
    total: totalRows[0]?.total ?? 0,
    categories: categoryRows[0]?.categories ?? 0,
    latestUpload: latestRows[0]?.uploaded_at ?? null,
  };
}
