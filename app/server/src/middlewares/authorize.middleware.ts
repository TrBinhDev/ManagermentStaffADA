import type { Request, Response, NextFunction } from "express";
import type { ManagerRole } from "@prisma/client";
import { ForbiddenError } from "../errors/AppError.js";
import { Message } from "../constants/message.js";

export function authorize(...allowedRoles: ManagerRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(Message.COMMON.FORBIDDEN, "FORBIDDEN");
    }
    next();
  };
}
