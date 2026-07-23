import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError.js";
import { HttpStatus } from "../constants/httpStatus.js";
import { Message } from "../constants/message.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
    return res.status(HttpStatus.CONFLICT).json({
      error: {
        code: "REFERENCED_BY_OTHER_DATA",
        message: "Không thể thực hiện vì dữ liệu này đang được tham chiếu bởi dữ liệu khác",
      },
    });
  }

  console.error("💥 Unexpected error:", err);

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: Message.COMMON.SERVER_ERROR,
    },
  });
}
