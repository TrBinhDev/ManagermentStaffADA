// Module: employment-period\r\n// Mô tả: Xử lý request/response cho các endpoint của module (chú thích ngắn gọn bằng tiếng Việt)\r\nimport type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpStatus } from '../../constants/httpStatus.js';
import * as employmentPeriodService from './employment-period.service.js';

export const getTimeline = asyncHandler(async (req: Request, res: Response) => {
  const timeline = await employmentPeriodService.getTimeline(req.params.id as string);
  res.status(HttpStatus.OK).json(timeline);
});

