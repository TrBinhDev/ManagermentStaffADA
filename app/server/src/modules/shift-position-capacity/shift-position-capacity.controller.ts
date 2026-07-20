import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpStatus } from '../../constants/httpStatus.js';
import * as capacityService from './shift-position-capacity.service.js';
import type { CreateCapacityInput, UpdateCapacityInput } from './shift-position-capacity.schema.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const capacities = await capacityService.list(req.params.id as string);
  res.status(HttpStatus.OK).json(capacities);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateCapacityInput;
  const capacity = await capacityService.create(req.params.id as string, body);
  res.status(HttpStatus.CREATED).json(capacity);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateCapacityInput;
  const capacity = await capacityService.update(req.params.id as string, req.params.capacityId as string, body);
  res.status(HttpStatus.OK).json(capacity);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await capacityService.remove(req.params.id as string, req.params.capacityId as string);
  res.status(HttpStatus.NO_CONTENT).send();
});
