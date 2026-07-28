import crypto from 'node:crypto';

// hash CCCD 1 chiều theo thuật toán SHA-256. Hàm này nhận vào một chuỗi cccd và trả về giá trị băm (hash) dưới dạng chuỗi hex. Việc băm giúp bảo vệ thông tin nhạy cảm bằng cách chuyển đổi dữ liệu gốc thành một giá trị duy nhất, không thể đảo ngược.

export function hashCccd(cccd: string): string {
  return crypto.createHash('sha256').update(cccd).digest('hex');
}
