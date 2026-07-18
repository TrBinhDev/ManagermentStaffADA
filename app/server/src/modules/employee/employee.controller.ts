import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpStatus } from '../../constants/httpStatus.js';
import * as employeeService from './employee.service.js';
import type {
  ListEmployeeQuery,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  RehireEmployeeInput,
} from './employee.schema.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListEmployeeQuery;
  const result = await employeeService.list(query);
  res.status(HttpStatus.OK).json(result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const employee = await employeeService.getById(req.params.id as string);
  res.status(HttpStatus.OK).json(employee);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateEmployeeInput;
  const employee = await employeeService.create(body);
  res.status(HttpStatus.CREATED).json(employee);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateEmployeeInput;
  const employee = await employeeService.update(req.params.id as string, body);
  res.status(HttpStatus.OK).json(employee);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await employeeService.remove(req.params.id as string);
  res.status(HttpStatus.NO_CONTENT).send();
});

export const resign = asyncHandler(async (req: Request, res: Response) => {
  const employee = await employeeService.resign(req.params.id as string);
  res.status(HttpStatus.OK).json(employee);
});

export const rehire = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as RehireEmployeeInput;
  const employee = await employeeService.rehire(req.params.id as string, body);
  res.status(HttpStatus.OK).json(employee);
});
