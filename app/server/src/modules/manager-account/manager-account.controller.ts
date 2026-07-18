import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpStatus } from '../../constants/httpStatus.js';
import * as managerAccountService from './manager-account.service.js';
import type {
  ListManagerAccountQuery,
  CreateManagerAccountInput,
  UpdateManagerAccountInput,
  ResetPasswordInput,
} from './manager-account.schema.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListManagerAccountQuery;
  const result = await managerAccountService.list(query);
  res.status(HttpStatus.OK).json(result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const account = await managerAccountService.getById(req.params.id as string);
  res.status(HttpStatus.OK).json(account);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateManagerAccountInput;
  const account = await managerAccountService.create(body);
  res.status(HttpStatus.CREATED).json(account);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateManagerAccountInput;
  const account = await managerAccountService.update(req.params.id as string, body);
  res.status(HttpStatus.OK).json(account);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as ResetPasswordInput;
  await managerAccountService.resetPassword(req.params.id as string, body);
  res.status(HttpStatus.OK).json({ message: 'Đặt lại mật khẩu thành công' });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await managerAccountService.remove(req.params.id as string);
  res.status(HttpStatus.NO_CONTENT).send();
});
