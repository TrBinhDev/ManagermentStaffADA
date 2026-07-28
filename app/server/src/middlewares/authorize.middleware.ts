import type { Request, Response, NextFunction } from "express";
import type { ManagerRole } from "@prisma/client";
import { ForbiddenError } from "../errors/AppError.js";
import { Message } from "../constants/message.js";

// Middleware authorize được sử dụng để kiểm tra quyền truy cập của người dùng dựa trên vai trò (role) của họ. Nó nhận vào một danh sách các vai trò được phép truy cập và kiểm tra xem người dùng hiện tại có thuộc vào danh sách đó hay không. Nếu không, nó sẽ ném ra lỗi ForbiddenError với thông báo tương ứng.

export function authorize(...allowedRoles: ManagerRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(Message.COMMON.FORBIDDEN, "FORBIDDEN");
    }
    next();
  };
}
