// Module xử lý các route liên quan tới xác thực (login, refresh, logout, me, change-password)
// Các comment bên dưới giải thích ngắn gọn bằng tiếng Việt để dễ hiểu
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpStatus } from '../../constants/httpStatus.js';
import { env } from '../../config/env.js';
import { REFRESH_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_MAX_AGE_MS } from '../../constants/jwt.constants.js';
import * as authService from './auth.service.js';
import type { LoginInput, ChangePasswordInput } from './auth.schema.js';

// Lưu refresh token vào cookie bảo mật (chỉ truy cập HTTP, chỉ đường dẫn /auth)
function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/auth',
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
  });
}

// Xóa cookie chứa refresh token khi đăng xuất hoặc lỗi phiên
function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: '/auth' });
}

// Xử lý đăng nhập: kiểm tra thông tin, trả access token và lưu refresh token vào cookie
export const login = asyncHandler(async (req: Request<unknown, unknown, LoginInput>, res: Response) => {
  const { accessToken, refreshToken, role } = await authService.login(req.body);

  setRefreshCookie(res, refreshToken);
  res.status(HttpStatus.OK).json({ token: accessToken, role });
});

// Làm mới phiên: dùng refresh token từ cookie để phát lại access token (và refresh token mới)
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

  try {
    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshSession(refreshToken);
    setRefreshCookie(res, newRefreshToken);
    res.status(HttpStatus.OK).json({ token: accessToken });
  } catch (err) {
    clearRefreshCookie(res);
    throw err;
  }
});

// Đăng xuất: xóa session lưu trên server và xóa cookie refresh token
export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.user!.managerAccountId);
  clearRefreshCookie(res);
  res.status(HttpStatus.NO_CONTENT).send();
});

// Trả về thông tin tài khoản hiện tại (nhỏ gọn)
export const me = asyncHandler(async (req: Request, res: Response) => {
  const account = await authService.getMe(req.user!.managerAccountId);
  res.status(HttpStatus.OK).json(account);
});

// Đổi mật khẩu: kiểm tra mật khẩu cũ, lưu mật khẩu mới (được validate ở validator)
export const changePassword = asyncHandler(
  async (req: Request<unknown, unknown, ChangePasswordInput>, res: Response) => {
    await authService.changePassword(req.user!.managerAccountId, req.body);
    res.status(HttpStatus.OK).json({ message: 'Đổi mật khẩu thành công' });
  },
);
