import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { BadRequestError } from '../errors/AppError.js';

// Hàm validate được sử dụng để xác thực dữ liệu đầu vào của một yêu cầu HTTP dựa trên một schema Zod. Nó nhận vào một schema và một nguồn dữ liệu (body hoặc query) và trả về một middleware function. Middleware này sẽ kiểm tra dữ liệu đầu vào, nếu không hợp lệ, nó sẽ ném ra lỗi BadRequestError với thông báo lỗi chi tiết. Nếu hợp lệ, nó sẽ gán dữ liệu đã xác thực trở lại vào req.body hoặc req.query và gọi next() để tiếp tục xử lý yêu cầu.

export function validate(schema: ZodSchema, source: 'body' | 'query' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const input = source === 'body' ? (req.body ?? {}) : req[source];
    const result = schema.safeParse(input);

    if (!result.success) {
      const message = result.error.issues.map((e) => e.message).join(', ');
      throw new BadRequestError(message, 'VALIDATION_ERROR');
    }

    if (source === 'query') {
      Object.defineProperty(req, 'query', {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      req.body = result.data;
    }
    next();
  };
}