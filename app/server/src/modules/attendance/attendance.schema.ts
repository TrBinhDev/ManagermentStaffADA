import { z } from "zod";

// Regex kiểm tra định dạng ngày YYYY-MM-DD
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Validate của check-in kèm gắn type của check-in
export const checkInSchema = z.object({
  employeeId: z.string().min(1, "employeeId không được để trống"), // Id nhân viên, bắt buộc
  shiftId: z.string().min(1, "shiftId không được để trống"), // Id ca làm, bắt buộc
  workDate: z
    .string()
    .regex(DATE_ONLY_REGEX, "Ngày không hợp lệ (định dạng YYYY-MM-DD)"), // Ngày làm việc, đúng định dạng YYYY-MM-DD
});
export type CheckInInput = z.infer<typeof checkInSchema>; // Type suy ra tự động từ schema, dùng cho input check-in

// Validate pagination + filter cho việc lấy toàn bộ lịch chấm công của nhân viên
export const listAttendanceQuerySchema = z.object({
  employeeId: z.string().optional(), // Lọc theo nhân viên, không bắt buộc
  from: z
    .string()
    .regex(DATE_ONLY_REGEX, "Ngày không hợp lệ (định dạng YYYY-MM-DD)")
    .optional(), // Lọc từ ngày, không bắt buộc
  to: z
    .string()
    .regex(DATE_ONLY_REGEX, "Ngày không hợp lệ (định dạng YYYY-MM-DD)")
    .optional(), // Lọc đến ngày, không bắt buộc
  page: z.coerce.number().int().min(1).default(1), // Số trang, ép kiểu từ string sang number, mặc định trang 1
  limit: z.coerce.number().int().min(1).max(100).default(20), // Số bản ghi mỗi trang, tối đa 100, mặc định 20
});
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuerySchema>; // Type suy ra tự động từ schema, dùng cho query list
