import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { HttpStatus } from "../../constants/httpStatus.js";
import * as dailyPaymentService from "./daily-payment.service.js";
import type {
  ListEmployeePaymentsQuery,
  ListAllPaymentsQuery,
} from "./daily-payment.schema.js";

// Controller lấy danh sách lương ngày của một nhân viên cụ thể
export const listByEmployee = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as ListEmployeePaymentsQuery; // Tham số lọc/phân trang từ query string
    // Lấy id nhân viên từ URL param, kèm bộ lọc từ query
    const result = await dailyPaymentService.listByEmployee(
      req.params.id as string,
      query,
    );
    res.status(HttpStatus.OK).json(result);
  },
);

// Controller lấy danh sách lương ngày của tất cả nhân viên (không giới hạn theo 1 nhân viên)
export const listAll = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListAllPaymentsQuery; // Tham số lọc/phân trang từ query string
  const result = await dailyPaymentService.listAll(query);
  res.status(HttpStatus.OK).json(result);
});
