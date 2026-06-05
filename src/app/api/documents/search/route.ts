import { NextResponse } from "next/server";
import { searchDocuments } from "@/lib/supabase/queries";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? searchParams.get("q") ?? "";

  if (!query.trim()) {
    return NextResponse.json({ data: [] });
  }

  const data = await searchDocuments(query);
  return NextResponse.json({ data });
}
