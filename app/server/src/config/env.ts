import 'dotenv/config';
import { z } from 'zod';

// Cấu hình biến môi trường sử dụng zod để xác thực và đảm bảo rằng các biến môi trường cần thiết được cung cấp. Nếu bất kỳ biến môi trường nào không hợp lệ hoặc thiếu, ứng dụng sẽ in ra lỗi và thoát.

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  CLIENT_ORIGIN: z.string().default('http://localhost:8080'),
  SECRET_KEY: z.string().min(1, 'SECRET_KEY is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;