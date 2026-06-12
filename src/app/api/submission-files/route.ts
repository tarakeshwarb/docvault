import { NextRequest, NextResponse } from "next/server";
import { queryDb } from "@/lib/db";

type FileRow = {
  file_id: string;
  file_name: string;
  s3_object_key: string;
  file_size: number;
  uploaded_at: string;
  version: number;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const submission_id = searchParams.get("submission_id");

  if (!submission_id) {
    return NextResponse.json({ error: "submission_id is required" }, { status: 400 });
  }

  const files = await queryDb<FileRow>(
    "SELECT file_id, file_name, s3_object_key, file_size, uploaded_at, version FROM public.file_metadata WHERE submission_id = $1 ORDER BY uploaded_at ASC",
    [submission_id]
  );

  return NextResponse.json({ files });
}