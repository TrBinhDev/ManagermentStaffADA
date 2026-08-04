import { PrismaClient } from '@prisma/client';

// Tạo một instance của PrismaClient để kết nối với cơ sở dữ liệu. Cấu hình logging được thiết lập dựa trên biến môi trường NODE_ENV. Nếu đang ở chế độ phát triển (development), nó sẽ log các truy vấn, lỗi và cảnh báo. Nếu không, nó chỉ log các lỗi.

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});