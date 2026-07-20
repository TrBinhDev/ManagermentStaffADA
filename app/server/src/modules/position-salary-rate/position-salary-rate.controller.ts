import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpStatus } from '../../constants/httpStatus.js';
import * as positionSalaryRateService from './position-salary-rate.service.js';
import type { CreateSalaryRateInput } from './position-salary-rate.schema.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const rates = await positionSalaryRateService.list(req.params.id as string);
  res.status(HttpStatus.OK).json(rates);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateSalaryRateInput;
  const rate = await positionSalaryRateService.create(req.params.id as string, body);
  res.status(HttpStatus.CREATED).json(rate);
});
