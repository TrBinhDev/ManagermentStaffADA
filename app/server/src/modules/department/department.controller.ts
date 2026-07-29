import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { HttpStatus } from "../../constants/httpStatus.js";
import * as departmentService from "./department.service.js";
import type {
  ListDepartmentQuery,
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "./department.schema.js";

// Controller lấy danh sách phòng ban (có lọc/phân trang từ query string)
export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListDepartmentQuery;
  const result = await departmentService.list(query);
  res.status(HttpStatus.OK).json(result);
});

// Controller lấy chi tiết 1 phòng ban theo Id
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const department = await departmentService.getById(req.params.id as string);
  res.status(HttpStatus.OK).json(department);
});

// Controller tạo mới phòng ban
export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateDepartmentInput;
  const department = await departmentService.create(body);
  res.status(HttpStatus.CREATED).json(department); // Trả về 201 kèm phòng ban vừa tạo
});

// Controller cập nhật thông tin phòng ban theo Id
export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateDepartmentInput;
  const department = await departmentService.update(
    req.params.id as string,
    body,
  );
  res.status(HttpStatus.OK).json(department);
});

// Controller xóa phòng ban theo Id
export const remove = asyncHandler(async (req: Request, res: Response) => {
  await departmentService.remove(req.params.id as string);
  res.status(HttpStatus.NO_CONTENT).send(); // Trả về 204 không có nội dung sau khi xóa
});
