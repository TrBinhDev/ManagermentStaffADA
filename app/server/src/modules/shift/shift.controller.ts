import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { HttpStatus } from "../../constants/httpStatus.js";
import * as shiftService from "./shift.service.js";
import type {
  ListShiftQuery,
  CreateShiftInput,
  UpdateShiftInput,
} from "./shift.schema.js";

// Controller lấy danh sách ca làm việc (có lọc/phân trang từ query string)
export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListShiftQuery;
  const result = await shiftService.list(query);
  res.status(HttpStatus.OK).json(result);
});

// Controller lấy chi tiết 1 ca làm việc theo Id
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const shift = await shiftService.getById(req.params.id as string);
  res.status(HttpStatus.OK).json(shift);
});

// Controller tạo mới ca làm việc
export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateShiftInput;
  const shift = await shiftService.create(body);
  res.status(HttpStatus.CREATED).json(shift); // Trả về 201 kèm ca làm việc vừa tạo
});

// Controller cập nhật thông tin ca làm việc theo Id
export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateShiftInput;
  const shift = await shiftService.update(req.params.id as string, body);
  res.status(HttpStatus.OK).json(shift);
});

// Controller xóa ca làm việc theo Id
export const remove = asyncHandler(async (req: Request, res: Response) => {
  await shiftService.remove(req.params.id as string);
  res.status(HttpStatus.NO_CONTENT).send(); // Trả về 204 không có nội dung sau khi xóa
});
