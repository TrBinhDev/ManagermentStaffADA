import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpStatus } from '../../constants/httpStatus.js';
import * as workScheduleService from './work-schedule.service.js';
import type {
  ListEmployeeWorkScheduleQuery,
  ListAllWorkScheduleQuery,
  BulkCreateWorkScheduleInput,
  UpdateWorkScheduleInput,
} from './work-schedule.schema.js';

export const listByEmployee = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListEmployeeWorkScheduleQuery;
  const result = await workScheduleService.listByEmployee(req.params.id as string, query);
  res.status(HttpStatus.OK).json(result);
});

export const bulkCreate = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as BulkCreateWorkScheduleInput;
  const result = await workScheduleService.bulkCreate(req.params.id as string, body);
  res.status(HttpStatus.CREATED).json(result);
});

export const updateShift = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateWorkScheduleInput;
  const result = await workScheduleService.updateShift(
    req.params.scheduleId as string,
    req.params.id as string,
    body,
  );
  res.status(HttpStatus.OK).json(result);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await workScheduleService.remove(req.params.scheduleId as string, req.params.id as string);
  res.status(HttpStatus.NO_CONTENT).send();
});

export const listAll = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListAllWorkScheduleQuery;
  const result = await workScheduleService.listAll(query);
  res.status(HttpStatus.OK).json(result);
});
