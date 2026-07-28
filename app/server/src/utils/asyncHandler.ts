import { Request, Response, NextFunction, RequestHandler } from 'express';

// Middleware asyncHandler được sử dụng để xử lý các route handler bất đồng bộ (asynchronous) trong Express. Nó giúp bắt lỗi từ các hàm bất đồng bộ và chuyển chúng đến middleware xử lý lỗi (error handling middleware) mà không cần phải sử dụng try-catch trong từng route handler. Điều này giúp mã nguồn trở nên sạch sẽ và dễ bảo trì hơn.

export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}