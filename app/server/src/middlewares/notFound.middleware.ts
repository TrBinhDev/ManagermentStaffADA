import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../errors/AppError.js';

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  next(new NotFoundError(`Route ${req.originalUrl} không tồn tại`));
}