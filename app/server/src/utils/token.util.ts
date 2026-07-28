import jwt from 'jsonwebtoken';
import type { ManagerRole } from '@prisma/client';
import { env } from '../config/env.js';
import { JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from '../constants/jwt.constants.js';
import { Message } from '../constants/message.js';
import { UnauthorizedError } from '../errors/AppError.js';
import type { JwtPayload } from '../middlewares/authenticate.middleware.js';

// File này chứa các hàm tiện ích liên quan đến việc tạo và xác minh token JWT. Nó sử dụng thư viện jsonwebtoken để thực hiện các thao tác này. Các hàm chính bao gồm signAccessToken, signRefreshToken và verifyRefreshToken.

export interface RefreshTokenPayload {
  managerAccountId: string;
  role: ManagerRole;
  employeeId: string | null;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    throw new UnauthorizedError(Message.COMMON.UNAUTHORIZED, 'INVALID_REFRESH_TOKEN');
  }
}
