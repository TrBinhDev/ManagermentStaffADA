import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../errors/AppError.js';

// Middleware notFoundHandler được sử dụng để xử lý các yêu cầu đến các route không tồn tại trong ứng dụng. Khi một yêu cầu không khớp với bất kỳ route nào đã được định nghĩa, middleware này sẽ tạo ra một lỗi NotFoundError và chuyển nó đến middleware xử lý lỗi tiếp theo.

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  next(new NotFoundError(`Route ${req.originalUrl} không tồn tại`));
}