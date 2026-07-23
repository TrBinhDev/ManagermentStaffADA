import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpStatus } from '../../constants/httpStatus.js';
import * as meService from './me.service.js';
import type { ListEmployeeWorkScheduleQuery } from '../work-schedule/work-schedule.schema.js';
import type { ListEmployeePaymentsQuery } from '../daily-payment/daily-payment.schema.js';
import type { MeAttendanceQuery, MeUpdateProfileInput } from './me.schema.js';


export const listWorkSchedule = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListEmployeeWorkScheduleQuery;
  const result = await meService.listWorkSchedule(req.user!.employeeId!, query);
  res.status(HttpStatus.OK).json(result);
});

export const listAttendance = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as MeAttendanceQuery;
  const result = await meService.listAttendance(req.user!.employeeId!, query);
  res.status(HttpStatus.OK).json(result);
});

export const listPayments = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListEmployeePaymentsQuery;
  const result = await meService.listPayments(req.user!.employeeId!, query);
  res.status(HttpStatus.OK).json(result);
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const result = await meService.getProfile(req.user!.employeeId!);
  res.status(HttpStatus.OK).json(result);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as MeUpdateProfileInput;
  const result = await meService.updateProfile(req.user!.employeeId!, body);
  res.status(HttpStatus.OK).json(result);
});
