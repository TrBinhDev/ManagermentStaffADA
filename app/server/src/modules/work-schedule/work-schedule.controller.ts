import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { HttpStatus } from "../../constants/httpStatus.js";
import * as workScheduleService from "./work-schedule.service.js";
import type {
  ListEmployeeWorkScheduleQuery,
  ListAllWorkScheduleQuery,
  BulkCreateWorkScheduleInput,
  UpdateWorkScheduleInput,
} from "./work-schedule.schema.js";

// Controller lấy lịch làm việc của 1 nhân viên theo Id
export const listByEmployee = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as ListEmployeeWorkScheduleQuery;
    const result = await workScheduleService.listByEmployee(
      req.params.id as string,
      query,
    );
    res.status(HttpStatus.OK).json(result);
  },
);

// Controller xếp lịch hàng loạt (nhiều ngày, 1 ca) cho 1 nhân viên
export const bulkCreate = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as BulkCreateWorkScheduleInput;
  const result = await workScheduleService.bulkCreate(
    req.params.id as string,
    body,
  );
  res.status(HttpStatus.CREATED).json(result); // Trả về 201 kèm kết quả xếp lịch (có thể gồm cả created + rejected, khớp UI đã xem)
});

// Controller đổi ca cho 1 bản ghi lịch làm việc cụ thể
export const updateShift = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateWorkScheduleInput;
  // Truyền cả scheduleId (bản ghi cần sửa) và id (nhân viên, để service kiểm tra bản ghi có đúng thuộc nhân viên này không)
  const result = await workScheduleService.updateShift(
    req.params.scheduleId as string,
    req.params.id as string,
    body,
  );
  res.status(HttpStatus.OK).json(result);
});

// Controller gỡ 1 bản ghi lịch làm việc
export const remove = asyncHandler(async (req: Request, res: Response) => {
  await workScheduleService.remove(
    req.params.scheduleId as string,
    req.params.id as string,
  );
  res.status(HttpStatus.NO_CONTENT).send(); // Trả về 204 không có nội dung sau khi gỡ
});

// Controller lấy lịch làm việc tổng hợp của tất cả nhân viên (có thể lọc theo ca)
export const listAll = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListAllWorkScheduleQuery;
  const result = await workScheduleService.listAll(query);
  res.status(HttpStatus.OK).json(result);
});
