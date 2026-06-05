import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { requireEnv } from "./env";

let cachedClient: S3Client | null = null;
const MAX_FILE_NAME = 80;
const getR2Client = () => {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: requireEnv("R2_ENDPOINT"),
      credentials: {
        accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      },
    });
  }
  return cachedClient;
};

const getBucket = () => requireEnv("R2_BUCKET");
const getPublicBase = () => requireEnv("R2_PUBLIC_BASE_URL");

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

export function sanitizeFileName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9.\-]+/g, "-")
    .replace(/-+/g, "-");
  const trimmed = base.replace(/^-+|-+$/g, "");
  return trimmed.slice(0, MAX_FILE_NAME) || "document.pdf";
}

export function buildR2Key(fileName: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `documents/${stamp}-${randomUUID()}-${sanitizeFileName(fileName)}`;
}

export async function uploadPdfToR2(params: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<string> {
  const r2Client = getR2Client();
  await r2Client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    })
  );
  return `${normalizeBaseUrl(getPublicBase())}/${params.key}`;
}

export function extractR2KeyFromUrl(url: string): string | null {
  const base = normalizeBaseUrl(getPublicBase());
  if (!url.startsWith(base)) {
    return null;
  }
  const key = url.slice(base.length);
  return key.startsWith("/") ? key.slice(1) : key;
}

export async function deleteFromR2(key: string): Promise<void> {
  const r2Client = getR2Client();
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    })
  );
}
