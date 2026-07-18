import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpStatus } from '../../constants/httpStatus.js';
import * as positionService from './position.service.js';
import type { ListPositionQuery, CreatePositionInput, UpdatePositionInput } from './position.schema.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListPositionQuery;
  const result = await positionService.list(query);
  res.status(HttpStatus.OK).json(result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const position = await positionService.getById(req.params.id as string);
  res.status(HttpStatus.OK).json(position);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreatePositionInput;
  const position = await positionService.create(body);
  res.status(HttpStatus.CREATED).json(position);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdatePositionInput;
  const position = await positionService.update(req.params.id as string, body);
  res.status(HttpStatus.OK).json(position);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await positionService.remove(req.params.id as string);
  res.status(HttpStatus.NO_CONTENT).send();
});
