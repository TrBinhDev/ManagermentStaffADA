import { Request, Response, NextFunction } from "express";
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
      error: { code: err.code, message: err.message },
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
