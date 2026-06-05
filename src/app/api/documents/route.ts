import { NextResponse } from "next/server";
import { createDocument, listDocuments } from "@/lib/supabase/queries";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const data = await listDocuments({
    category,
    limit: 50,
  });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : null;
  const category = typeof body?.category === "string" ? body.category.trim() : null;
  const pdfUrl = typeof body?.pdf_url === "string" ? body.pdf_url.trim() : "";
  const fileName =
    typeof body?.file_name === "string" ? body.file_name.trim() : null;
  const fileSize =
    typeof body?.file_size === "number" ? body.file_size : null;

  if (!title || !pdfUrl) {
    return NextResponse.json(
      { error: "title and pdf_url are required" },
      { status: 400 }
    );
  }

  const data = await createDocument({
    title,
    description,
    category,
    pdf_url: pdfUrl,
    file_name: fileName,
    file_size: fileSize,
  });

  return NextResponse.json({ data }, { status: 201 });
}
