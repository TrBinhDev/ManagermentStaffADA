import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { HttpStatus } from "../../constants/httpStatus.js";
import * as capacityService from "./shift-position-capacity.service.js";
import type {
  CreateCapacityInput,
  UpdateCapacityInput,
} from "./shift-position-capacity.schema.js";

// Controller lấy danh sách giới hạn nhân sự của 1 ca làm việc theo Id
export const list = asyncHandler(async (req: Request, res: Response) => {
  const capacities = await capacityService.list(req.params.id as string);
  res.status(HttpStatus.OK).json(capacities);
});

// Controller tạo mới giới hạn nhân sự cho 1 vị trí trong ca làm việc
export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateCapacityInput;
  const capacity = await capacityService.create(req.params.id as string, body);
  res.status(HttpStatus.CREATED).json(capacity); // Trả về 201 kèm giới hạn vừa tạo
});

// Controller cập nhật giới hạn nhân sự (chỉ sửa maxStaff) theo id ca + id giới hạn
export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateCapacityInput;
  const capacity = await capacityService.update(
    req.params.id as string,
    req.params.capacityId as string,
    body,
  );
  res.status(HttpStatus.OK).json(capacity);
});

// Controller xóa giới hạn nhân sự theo id ca + id giới hạn
export const remove = asyncHandler(async (req: Request, res: Response) => {
  await capacityService.remove(
    req.params.id as string,
    req.params.capacityId as string,
  );
  res.status(HttpStatus.NO_CONTENT).send(); // Trả về 204 không có nội dung sau khi xóa
});
