import { NextResponse } from "next/server";
import {
  deleteDocumentById,
  getDocumentById,
} from "@/lib/supabase/queries";
import { deleteFromR2, extractR2KeyFromUrl } from "@/lib/r2";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await getDocumentById(id);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await getDocumentById(id);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const key = extractR2KeyFromUrl(data.pdf_url);
  if (key) {
    await deleteFromR2(key);
  }

  await deleteDocumentById(id);

  return NextResponse.json({ ok: true });
}
