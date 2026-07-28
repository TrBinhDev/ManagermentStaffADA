import { redisClient } from '../config/redis.js';
import { REFRESH_TOKEN_COOKIE_MAX_AGE_MS } from '../constants/jwt.constants.js';

const SESSION_TTL_SECONDS = REFRESH_TOKEN_COOKIE_MAX_AGE_MS / 1000;

// File này chứa các hàm tiện ích để quản lý phiên làm việc (session) của người dùng trong ứng dụng. Nó sử dụng Redis để lưu trữ và truy xuất thông tin phiên làm việc dựa trên ID tài khoản quản lý (managerAccountId). Các hàm chính bao gồm:
// - sessionKey: Tạo khóa phiên làm việc dựa trên ID tài khoản quản lý.
// - setSession: Lưu trữ token làm mới (refresh token) vào Redis với thời gian sống (TTL) xác định.
// - getSession: Truy xuất token làm mới từ Redis dựa trên ID tài khoản quản lý.
// - deleteSession: Xóa thông tin phiên làm việc khỏi Redis dựa trên ID tài khoản quản lý.

function sessionKey(managerAccountId: string): string {
  return `session:${managerAccountId}`;
}

export async function setSession(managerAccountId: string, refreshToken: string): Promise<void> {
  await redisClient.set(sessionKey(managerAccountId), refreshToken, { EX: SESSION_TTL_SECONDS });
}

export async function getSession(managerAccountId: string): Promise<string | null> {
  return redisClient.get(sessionKey(managerAccountId));
}

export async function deleteSession(managerAccountId: string): Promise<void> {
  await redisClient.del(sessionKey(managerAccountId));
}
