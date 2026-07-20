import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpStatus } from '../../constants/httpStatus.js';
import * as attendanceService from './attendance.service.js';
import type { CheckInInput, ListAttendanceQuery } from './attendance.schema.js';

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CheckInInput;
  const attendance = await attendanceService.checkIn(body, req.user!.managerAccountId);
  res.status(HttpStatus.CREATED).json(attendance);
});

export const checkOut = asyncHandler(async (req: Request, res: Response) => {
  const result = await attendanceService.checkOut(req.params.id as string, req.user!.managerAccountId);
  res.status(HttpStatus.OK).json(result);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListAttendanceQuery;
  const result = await attendanceService.list(query);
  res.status(HttpStatus.OK).json(result);
});
