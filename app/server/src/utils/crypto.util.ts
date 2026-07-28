import crypto from 'node:crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const key = crypto.createHash('sha256').update(env.SECRET_KEY).digest();

// Hàm encrypt được sử dụng để mã hóa một chuỗi văn bản (plainText) bằng thuật toán AES-256-GCM. Nó tạo ra một vector khởi tạo (IV) ngẫu nhiên, mã hóa văn bản và trả về kết quả dưới dạng chuỗi base64, bao gồm IV, tag xác thực và dữ liệu đã mã hóa.

export function encrypt(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

// Hàm decrypt được sử dụng để giải mã một chuỗi văn bản đã được mã hóa (cipherText) bằng thuật toán AES-256-GCM. Nó tách IV, tag xác thực và dữ liệu đã mã hóa từ chuỗi base64, sau đó giải mã dữ liệu và trả về kết quả dưới dạng chuỗi văn bản gốc.

export function decrypt(cipherText: string): string {
  const buffer = Buffer.from(cipherText, 'base64');
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
