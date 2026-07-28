import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { ManagerRole } from "@prisma/client";
import { UnauthorizedError } from "../errors/AppError.js";
import { Message } from "../constants/message.js";
import { env } from "../config/env.js";

// Middleware authenticate được sử dụng để xác thực người dùng dựa trên JWT (JSON Web Token). Nó kiểm tra xem token có hợp lệ hay không và nếu hợp lệ, nó sẽ giải mã token và gán thông tin người dùng vào req.user để các middleware hoặc route handler tiếp theo có thể sử dụng.

export interface JwtPayload {
  managerAccountId: string;
  role: ManagerRole;
  employeeId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError(Message.COMMON.UNAUTHORIZED, "MISSING_TOKEN");
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    req.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    next();
  } catch {
    throw new UnauthorizedError(
      "Token không hợp lệ hoặc đã hết hạn",
      "INVALID_TOKEN",
    );
  }
}
