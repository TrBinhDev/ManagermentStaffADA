// Module: daily-payment\r\n// Mô tả: Xử lý request/response cho các endpoint của module (chú thích ngắn gọn bằng tiếng Việt)\r\nimport type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpStatus } from '../../constants/httpStatus.js';
import * as dailyPaymentService from './daily-payment.service.js';
import type { ListEmployeePaymentsQuery, ListAllPaymentsQuery } from './daily-payment.schema.js';

export const listByEmployee = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListEmployeePaymentsQuery;
  const result = await dailyPaymentService.listByEmployee(req.params.id as string, query);
  res.status(HttpStatus.OK).json(result);
});

export const listAll = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListAllPaymentsQuery;
  const result = await dailyPaymentService.listAll(query);
  res.status(HttpStatus.OK).json(result);
});

