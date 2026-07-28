// Logic chính cho xác thực: đăng nhập, làm mới token, đăng xuất, lấy thông tin, đổi mật khẩu
// Các hàm ở đây gọi repository để truy vấn DB và utils để xử lý token/session
import bcrypt from 'bcrypt';
import { Message } from '../../constants/message.js';
import { UnauthorizedError } from '../../errors/AppError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/token.util.js';
import { setSession, getSession, deleteSession } from '../../utils/session.util.js';
import * as authRepository from './auth.repository.js';
import type { LoginInput, ChangePasswordInput } from './auth.schema.js';

// Số vòng băm cho bcrypt (độ phức tạp hash)
const BCRYPT_ROUNDS = 10;

// Đăng nhập: kiểm tra email + mật khẩu, tạo access và refresh token, lưu session
export async function login({ email, password }: LoginInput) {
  const account = await authRepository.findByEmail(email);

  // Nếu không tồn tại tài khoản hoặc bị khóa => không được phép đăng nhập
  if (!account || !account.isActive) {
    throw new UnauthorizedError(Message.AUTH.LOCKED_ACCOUNT, 'INVALID_CREDENTIALS');
  }

  // So sánh mật khẩu gửi lên với hash trong DB
  const passwordMatches = await bcrypt.compare(password, account.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError(Message.AUTH.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS');
  }

  // Tạo token và lưu refresh token vào session (redis hoặc store khác)
  const accessToken = signAccessToken({ managerAccountId: account.id, role: account.role, employeeId: account.employeeId });
  const refreshToken = signRefreshToken({ managerAccountId: account.id, role: account.role, employeeId: account.employeeId });
  await setSession(account.id, refreshToken);

  return { accessToken, refreshToken, role: account.role };
}

// Làm mới phiên dựa trên refresh token: verify token, kiểm tra với session lưu trên server, trả access token mới và refresh token mới
export async function refreshSession(refreshToken: string | undefined) {
  if (!refreshToken) {
    throw new UnauthorizedError(Message.COMMON.UNAUTHORIZED, 'MISSING_REFRESH_TOKEN');
  }

  // Giải mã và kiểm tra tính hợp lệ của refresh token
  const payload = verifyRefreshToken(refreshToken);

  // So sánh với token đang lưu trong session (để hỗ trợ revocation)
  const storedToken = await getSession(payload.managerAccountId);
  if (!storedToken || storedToken !== refreshToken) {
    throw new UnauthorizedError(Message.COMMON.UNAUTHORIZED, 'SESSION_EXPIRED');
  }

  // Tạo access token mới và refresh token mới, cập nhật session
  const accessToken = signAccessToken({ managerAccountId: payload.managerAccountId, role: payload.role, employeeId: payload.employeeId });
  const newRefreshToken = signRefreshToken({ managerAccountId: payload.managerAccountId, role: payload.role, employeeId: payload.employeeId });
  await setSession(payload.managerAccountId, newRefreshToken);

  return { accessToken, refreshToken: newRefreshToken };
}

// Đăng xuất: xóa session (refresh token) trên server
export async function logout(managerAccountId: string): Promise<void> {
  await deleteSession(managerAccountId);
}

// Lấy thông tin cơ bản của tài khoản hiện tại để trả về cho client
export async function getMe(managerAccountId: string) {
  const account = await authRepository.findMeById(managerAccountId);

  if (!account) {
    throw new UnauthorizedError(Message.COMMON.UNAUTHORIZED, 'ACCOUNT_NOT_FOUND');
  }

  return account;
}

// Đổi mật khẩu: xác thực mật khẩu cũ rồi lưu mật khẩu mới (hash)
export async function changePassword(
  managerAccountId: string,
  { oldPassword, newPassword }: ChangePasswordInput,
): Promise<void> {
  const account = await authRepository.findById(managerAccountId);

  if (!account) {
    throw new UnauthorizedError(Message.COMMON.UNAUTHORIZED, 'ACCOUNT_NOT_FOUND');
  }

  // Kiểm tra mật khẩu cũ
  const oldPasswordMatches = await bcrypt.compare(oldPassword, account.passwordHash);
  if (!oldPasswordMatches) {
    throw new UnauthorizedError(Message.AUTH.INVALID_OLD_PASSWORD, 'INVALID_OLD_PASSWORD');
  }

  // Hash mật khẩu mới và cập nhật
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await authRepository.updatePasswordHash(managerAccountId, passwordHash);
}
