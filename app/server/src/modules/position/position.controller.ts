import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js"; // Wrap handler async để tự bắt lỗi, đẩy qua errorHandler
import { HttpStatus } from "../../constants/httpStatus.js";
import * as positionService from "./position.service.js";
import type {
  ListPositionQuery,
  CreatePositionInput,
  UpdatePositionInput,
} from "./position.schema.js";

// GET /positions - Lấy danh sách vị trí (đã qua validate query ở middleware)
export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListPositionQuery; // Ép kiểu vì req.query gốc là string
  const result = await positionService.list(query);
  res.status(HttpStatus.OK).json(result);
});

// GET /positions/:id - Lấy chi tiết 1 vị trí
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const position = await positionService.getById(req.params.id as string);
  res.status(HttpStatus.OK).json(position);
});

// POST /positions - Tạo mới vị trí, trả về 201
export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreatePositionInput;
  const position = await positionService.create(body);
  res.status(HttpStatus.CREATED).json(position);
});

// PATCH /positions/:id - Cập nhật vị trí theo id
export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdatePositionInput;
  const position = await positionService.update(req.params.id as string, body);
  res.status(HttpStatus.OK).json(position);
});

// DELETE /positions/:id - Xóa vị trí, trả về 204 (no content)
export const remove = asyncHandler(async (req: Request, res: Response) => {
  await positionService.remove(req.params.id as string);
  res.status(HttpStatus.NO_CONTENT).send();
});
