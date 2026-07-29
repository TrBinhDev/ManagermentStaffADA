import bcrypt from "bcrypt";
import { Message } from "../../constants/message.js";
import { UnauthorizedError } from "../../errors/AppError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/token.util.js";
import {
  setSession,
  getSession,
  deleteSession,
} from "../../utils/session.util.js";
import * as authRepository from "./auth.repository.js";
import type { LoginInput, ChangePasswordInput } from "./auth.schema.js";

const BCRYPT_ROUNDS = 10; // Số vòng lặp hash mật khẩu bằng bcrypt (độ khó băm)

// Hàm xử lý đăng nhập
export async function login({ email, password }: LoginInput) {
  const account = await authRepository.findByEmail(email); // Tìm tài khoản theo email

  // Không tồn tại hoặc tài khoản đã bị khóa/vô hiệu hóa thì báo lỗi
  if (!account || !account.isActive) {
    throw new UnauthorizedError(
      Message.AUTH.LOCKED_ACCOUNT,
      "INVALID_CREDENTIALS",
    );
  }

  // So sánh mật khẩu người dùng nhập với mật khẩu đã hash trong DB
  const passwordMatches = await bcrypt.compare(password, account.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError(
      Message.AUTH.INVALID_CREDENTIALS,
      "INVALID_CREDENTIALS",
    );
  }

  // Tạo access token (thời gian sống ngắn) và refresh token (thời gian sống dài)
  const accessToken = signAccessToken({
    managerAccountId: account.id,
    role: account.role,
    employeeId: account.employeeId,
  });
  const refreshToken = signRefreshToken({
    managerAccountId: account.id,
    role: account.role,
    employeeId: account.employeeId,
  });
  await setSession(account.id, refreshToken); // Lưu refresh token vào session (để sau này đối chiếu khi refresh/logout)

  return { accessToken, refreshToken, role: account.role };
}

// Hàm làm mới access token bằng refresh token
export async function refreshSession(refreshToken: string | undefined) {
  // Không có refresh token gửi lên thì báo lỗi
  if (!refreshToken) {
    throw new UnauthorizedError(
      Message.COMMON.UNAUTHORIZED,
      "MISSING_REFRESH_TOKEN",
    );
  }

  const payload = verifyRefreshToken(refreshToken); // Giải mã + kiểm tra tính hợp lệ của refresh token

  // So sánh với refresh token đang lưu trong session (chống dùng token cũ/đã bị thu hồi)
  const storedToken = await getSession(payload.managerAccountId);
  if (!storedToken || storedToken !== refreshToken) {
    throw new UnauthorizedError(Message.COMMON.UNAUTHORIZED, "SESSION_EXPIRED");
  }

  // Cấp access token mới và refresh token mới (xoay vòng refresh token để tăng bảo mật)
  const accessToken = signAccessToken({
    managerAccountId: payload.managerAccountId,
    role: payload.role,
    employeeId: payload.employeeId,
  });
  const newRefreshToken = signRefreshToken({
    managerAccountId: payload.managerAccountId,
    role: payload.role,
    employeeId: payload.employeeId,
  });
  await setSession(payload.managerAccountId, newRefreshToken); // Cập nhật session với refresh token mới

  return { accessToken, refreshToken: newRefreshToken };
}

// Hàm đăng xuất: xóa session (thu hồi refresh token) của tài khoản
export async function logout(managerAccountId: string): Promise<void> {
  await deleteSession(managerAccountId);
}

// Hàm lấy thông tin tài khoản đang đăng nhập
export async function getMe(managerAccountId: string) {
  const account = await authRepository.findMeById(managerAccountId);

  if (!account) {
    throw new UnauthorizedError(
      Message.COMMON.UNAUTHORIZED,
      "ACCOUNT_NOT_FOUND",
    );
  }

  return account;
}

// Hàm đổi mật khẩu
export async function changePassword(
  managerAccountId: string,
  { oldPassword, newPassword }: ChangePasswordInput,
): Promise<void> {
  const account = await authRepository.findById(managerAccountId);

  if (!account) {
    throw new UnauthorizedError(
      Message.COMMON.UNAUTHORIZED,
      "ACCOUNT_NOT_FOUND",
    );
  }

  // Kiểm tra mật khẩu cũ nhập vào có khớp với mật khẩu hiện tại không
  const oldPasswordMatches = await bcrypt.compare(
    oldPassword,
    account.passwordHash,
  );
  if (!oldPasswordMatches) {
    throw new UnauthorizedError(
      Message.AUTH.INVALID_OLD_PASSWORD,
      "INVALID_OLD_PASSWORD",
    );
  }

  // Hash mật khẩu mới rồi lưu vào DB
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await authRepository.updatePasswordHash(managerAccountId, passwordHash);
}
