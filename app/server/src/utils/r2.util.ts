import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

// R2 tương thích S3 API, chỉ cần đổi endpoint trỏ về Cloudflare thay vì AWS
const r2Client = new S3Client({
  region: "auto", // R2 không phân region như AWS, để "auto"
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME as string;
// Domain public để build URL trả về client (custom domain đã gắn cho bucket, hoặc r2.dev public URL)
const PUBLIC_URL_BASE = process.env.R2_PUBLIC_URL as string;

// Upload buffer (ảnh avatar) lên R2, trả về URL public để lưu vào DB
export async function uploadAvatarToR2(
  buffer: Buffer,
  mimeType: string,
): Promise<{ key: string; url: string }> {
  const ext = mimeType.split("/")[1] ?? "jpg"; // vd: "image/png" -> "png"
  const key = `avatars/${randomUUID()}.${ext}`; // tên file random tránh trùng/đoán được

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }),
  );

  return { key, url: `${PUBLIC_URL_BASE}/${key}` };
}

// Xóa avatar cũ trên R2 khi user upload avatar mới (tránh rác tích tụ trong bucket)
export async function deleteAvatarFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
  );
}

// Trích key từ url đã lưu trong DB (để xóa file cũ trên R2 khi thay avatar mới)
export function extractKeyFromUrl(url: string): string | null {
  if (!url.startsWith(PUBLIC_URL_BASE)) return null;
  return url.slice(PUBLIC_URL_BASE.length + 1); // +1 để bỏ dấu "/"
}