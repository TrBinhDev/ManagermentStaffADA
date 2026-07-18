import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpStatus } from '../../constants/httpStatus.js';
import { env } from '../../config/env.js';
import { REFRESH_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_MAX_AGE_MS } from '../../constants/jwt.constants.js';
import * as authService from './auth.service.js';
import type { LoginInput, ChangePasswordInput } from './auth.schema.js';

function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/auth',
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: '/auth' });
}

export const login = asyncHandler(async (req: Request<unknown, unknown, LoginInput>, res: Response) => {
  const { accessToken, refreshToken, role } = await authService.login(req.body);

  setRefreshCookie(res, refreshToken);
  res.status(HttpStatus.OK).json({ token: accessToken, role });
});

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

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.user!.managerAccountId);
  clearRefreshCookie(res);
  res.status(HttpStatus.NO_CONTENT).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const account = await authService.getMe(req.user!.managerAccountId);
  res.status(HttpStatus.OK).json(account);
});

export const changePassword = asyncHandler(
  async (req: Request<unknown, unknown, ChangePasswordInput>, res: Response) => {
    await authService.changePassword(req.user!.managerAccountId, req.body);
    res.status(HttpStatus.OK).json({ message: 'Đổi mật khẩu thành công' });
  },
);
