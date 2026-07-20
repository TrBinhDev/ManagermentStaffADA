import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpStatus } from '../../constants/httpStatus.js';
import * as shiftService from './shift.service.js';
import type { ListShiftQuery, CreateShiftInput, UpdateShiftInput } from './shift.schema.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListShiftQuery;
  const result = await shiftService.list(query);
  res.status(HttpStatus.OK).json(result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const shift = await shiftService.getById(req.params.id as string);
  res.status(HttpStatus.OK).json(shift);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateShiftInput;
  const shift = await shiftService.create(body);
  res.status(HttpStatus.CREATED).json(shift);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateShiftInput;
  const shift = await shiftService.update(req.params.id as string, body);
  res.status(HttpStatus.OK).json(shift);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await shiftService.remove(req.params.id as string);
  res.status(HttpStatus.NO_CONTENT).send();
});
