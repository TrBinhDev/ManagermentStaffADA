import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { HttpStatus } from "../../constants/httpStatus.js";
import * as attendanceService from "./attendance.service.js";
import type { CheckInInput, ListAttendanceQuery } from "./attendance.schema.js";

// Controller checkIn xử lý yêu cầu check-in của nhân viên
export const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CheckInInput; // Lấy dữ liệu check-in từ body request (employeeId, shiftId, workDate...)
  // Gọi service xử lý logic check-in, kèm id người thực hiện thao tác (lấy từ user đã đăng nhập)
  const attendance = await attendanceService.checkIn(
    body,
    req.user!.managerAccountId,
  );
  res.status(HttpStatus.CREATED).json(attendance); // Trả về 201 kèm bản ghi chấm công vừa tạo
});

// Controller checkOut xử lý yêu cầu check-out của nhân viên
export const checkOut = asyncHandler(async (req: Request, res: Response) => {
  // Lấy id bản ghi chấm công từ param URL, kèm id người thực hiện thao tác
  const result = await attendanceService.checkOut(
    req.params.id as string,
    req.user!.managerAccountId,
  );
  res.status(HttpStatus.OK).json(result); // Trả về kết quả check-out (kèm thông tin lương đã tính)
});

// Controller list xử lý việc lấy danh sách lịch chấm công (có lọc + phân trang)
export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListAttendanceQuery; // Lấy tham số lọc/phân trang từ query string
  const result = await attendanceService.list(query);
  res.status(HttpStatus.OK).json(result); // Trả về danh sách chấm công kèm tổng số bản ghi, trang, limit
});
