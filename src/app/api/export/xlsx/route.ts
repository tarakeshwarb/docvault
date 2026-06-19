import { NextResponse } from "next/server";
import { buildXlsxBuffer, type ExcelPayload } from "@/lib/excel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = ExcelPayload & { filename?: string };

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body?.title || !Array.isArray(body.columns) || !Array.isArray(body.rows)) {
    return NextResponse.json(
      { error: "title, columns and rows are required." },
      { status: 400 }
    );
  }

  try {
    const buffer = await buildXlsxBuffer(body);
    const safeName = (body.filename || body.title || "export")
      .replace(/[^a-z0-9-_]+/gi, "_")
      .replace(/_+/g, "_")
      .slice(0, 80);
    const stamp = new Date().toISOString().split("T")[0];

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${safeName}_${stamp}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("xlsx export failed", err);
    return NextResponse.json(
      { error: "Failed to generate spreadsheet." },
      { status: 500 }
    );
  }
}
