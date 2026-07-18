import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpStatus } from '../../constants/httpStatus.js';
import * as departmentService from './department.service.js';
import type { ListDepartmentQuery, CreateDepartmentInput, UpdateDepartmentInput } from './department.schema.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListDepartmentQuery;
  const result = await departmentService.list(query);
  res.status(HttpStatus.OK).json(result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const department = await departmentService.getById(req.params.id as string);
  res.status(HttpStatus.OK).json(department);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateDepartmentInput;
  const department = await departmentService.create(body);
  res.status(HttpStatus.CREATED).json(department);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateDepartmentInput;
  const department = await departmentService.update(req.params.id as string, body);
  res.status(HttpStatus.OK).json(department);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await departmentService.remove(req.params.id as string);
  res.status(HttpStatus.NO_CONTENT).send();
});
