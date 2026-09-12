import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

function sanitize(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  try {
    const { file_name, content_type, submission_id, component_id, audit_offering_id, file_size } = await req.json();

    // Either a per-faculty submission upload, a coordinator's common-component upload, or an audit report upload.
    const scopeId: string | undefined = submission_id || component_id || audit_offering_id;
    if (!file_name || !scopeId) {
      return NextResponse.json(
        { error: "file_name and submission_id (or component_id/audit_offering_id) are required." },
        { status: 400 }
      );
    }

    if ((submission_id || audit_offering_id) && typeof file_size === "number" && file_size > 3 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds the maximum allowed size of 3MB." }, { status: 400 });
    }

    const folder = submission_id ? "submissions" : audit_offering_id ? "audit" : "common";
    const effectiveContentType = content_type || "application/octet-stream";

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
      ContentType: effectiveContentType,
    });

    const upload_url = await getSignedUrl(client, command, { expiresIn: 300 });

    return NextResponse.json({ upload_url, r2_object_key });
  } catch (err) {
    console.error("Upload URL error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
