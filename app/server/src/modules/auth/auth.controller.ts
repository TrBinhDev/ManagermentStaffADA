import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { HttpStatus } from "../../constants/httpStatus.js";
import { env } from "../../config/env.js";
import {
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
} from "../../constants/jwt.constants.js";
import * as authService from "./auth.service.js";
import type { LoginInput, ChangePasswordInput } from "./auth.schema.js";

// Hàm set cookie chứa refresh token vào response
function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true, // Không cho JS phía client đọc cookie (chống XSS)
    secure: env.NODE_ENV === "production", // Chỉ gửi cookie qua HTTPS khi ở môi trường production
    sameSite: "strict", // Chỉ gửi cookie khi request cùng site (chống CSRF)
    path: "/auth", // Cookie chỉ được gửi kèm với các request tới đường dẫn /auth
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS, // Thời gian sống của cookie
  });
}

// Hàm xóa cookie refresh token (dùng khi logout hoặc refresh thất bại)
function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: "/auth" });
}

// API đăng nhập: nhận email/password, trả về access token + set cookie refresh token
export const login = asyncHandler(
  async (req: Request<unknown, unknown, LoginInput>, res: Response) => {
    const { accessToken, refreshToken, role } = await authService.login(
      req.body,
    );

    setRefreshCookie(res, refreshToken); // Lưu refresh token vào cookie
    res.status(HttpStatus.OK).json({ token: accessToken, role }); // Trả access token + vai trò cho client
  },
);

// API làm mới access token bằng refresh token lấy từ cookie
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME]; // Lấy refresh token từ cookie request

  try {
    // Gọi service để kiểm tra và cấp lại access token + refresh token mới
    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshSession(refreshToken);
    setRefreshCookie(res, newRefreshToken); // Cập nhật cookie với refresh token mới
    res.status(HttpStatus.OK).json({ token: accessToken });
  } catch (err) {
    // Nếu refresh thất bại (token hết hạn/không hợp lệ) thì xóa cookie luôn
    clearRefreshCookie(res);
    throw err;
  }
});

// API đăng xuất: hủy phiên đăng nhập ở server và xóa cookie refresh token
export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.user!.managerAccountId); // Thu hồi refresh token/phiên trong DB
  clearRefreshCookie(res);
  res.status(HttpStatus.NO_CONTENT).send(); // Trả về 204 không có nội dung
});

// API lấy thông tin tài khoản đang đăng nhập (dựa vào user đã xác thực từ middleware)
export const me = asyncHandler(async (req: Request, res: Response) => {
  const account = await authService.getMe(req.user!.managerAccountId);
  res.status(HttpStatus.OK).json(account);
});

// API đổi mật khẩu cho tài khoản đang đăng nhập
export const changePassword = asyncHandler(
  async (
    req: Request<unknown, unknown, ChangePasswordInput>,
    res: Response,
  ) => {
    await authService.changePassword(req.user!.managerAccountId, req.body);
    res.status(HttpStatus.OK).json({ message: "Đổi mật khẩu thành công" });
  },
);
