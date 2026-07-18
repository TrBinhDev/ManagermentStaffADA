import { HttpStatus } from "../constants/httpStatus.js";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code: string = "BAD_REQUEST", details?: unknown) {
    super(message, HttpStatus.BAD_REQUEST, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, code: string = "UNAUTHORIZED", details?: unknown) {
    super(message, HttpStatus.UNAUTHORIZED, code, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, code: string = "FORBIDDEN", details?: unknown) {
    super(message, HttpStatus.FORBIDDEN, code, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code: string = "NOT_FOUND", details?: unknown) {
    super(message, HttpStatus.NOT_FOUND, code, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: string = "CONFLICT", details?: unknown) {
    super(message, HttpStatus.CONFLICT, code, details);
  }
}
