import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpStatus } from '../../constants/httpStatus.js';
import * as employeeProfileService from './employee-profile.service.js';
import type { UpsertEmployeeProfileInput } from './employee-profile.schema.js';

// Controller lấy hồ sơ chi tiết của 1 nhân viên theo Id
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await employeeProfileService.getProfile(req.params.id as string);
  res.status(HttpStatus.OK).json(profile);
});

// Controller tạo mới hoặc cập nhật hồ sơ chi tiết nhân viên (upsert) theo Id
export const upsertProfile = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpsertEmployeeProfileInput;
  const profile = await employeeProfileService.upsertProfile(req.params.id as string, body);
  res.status(HttpStatus.OK).json(profile);
});