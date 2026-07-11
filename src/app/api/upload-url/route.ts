import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "application/zip",
];

function sanitize(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  try {
    const { file_name, content_type, submission_id, component_id } = await req.json();

    // Either a per-faculty submission upload, or a coordinator's common-component upload.
    const scopeId: string | undefined = submission_id || component_id;
    if (!file_name || !content_type || !scopeId) {
      return NextResponse.json(
        { error: "file_name, content_type and submission_id (or component_id) are required." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(content_type)) {
      return NextResponse.json({ error: "File type not allowed." }, { status: 400 });
    }

    const folder = submission_id ? "submissions" : "common";

    if (!process.env.R2_ENDPOINT || !process.env.R2_BUCKET) {
      // Graceful dev fallback when R2 is not configured
      return NextResponse.json({
        upload_url: null,
        r2_object_key: `dev/${folder}/${scopeId}/${sanitize(file_name)}`,
        dev_mode: true,
      });
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const r2_object_key = `${folder}/${scopeId}/${stamp}-${randomUUID()}-${sanitize(file_name)}`;

    const client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: r2_object_key,
      ContentType: content_type,
    });

    const upload_url = await getSignedUrl(client, command, { expiresIn: 300 });

    return NextResponse.json({ upload_url, r2_object_key });
  } catch (err) {
    console.error("Upload URL error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
