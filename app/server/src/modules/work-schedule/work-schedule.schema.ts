import { z } from "zod";

// Regex kiểm tra định dạng ngày YYYY-MM-DD
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Validate query khi xem lịch làm việc của 1 nhân viên theo tháng/năm
export const listEmployeeWorkScheduleQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12), // Tháng, ép kiểu từ string sang number, bắt buộc
  year: z.coerce.number().int().min(2000).max(2100), // Năm, bắt buộc
});
export type ListEmployeeWorkScheduleQuery = z.infer<
  typeof listEmployeeWorkScheduleQuerySchema
>; // Type suy ra tự động từ schema

// Validate query khi xem lịch làm việc của tất cả nhân viên theo tháng/năm, có thể lọc thêm theo ca
export const listAllWorkScheduleQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12), // Tháng, bắt buộc
  year: z.coerce.number().int().min(2000).max(2100), // Năm, bắt buộc
  shiftId: z.string().optional(), // Lọc theo ca làm việc, không bắt buộc
});
export type ListAllWorkScheduleQuery = z.infer<
  typeof listAllWorkScheduleQuerySchema
>; // Type suy ra tự động từ schema

// Validate dữ liệu xếp lịch làm việc hàng loạt cho 1 nhân viên (nhiều ngày cùng lúc, cùng 1 ca)
export const bulkCreateWorkScheduleSchema = z.object({
  shiftId: z.string().min(1, "shiftId không được để trống"), // Ca làm việc áp dụng cho tất cả các ngày chọn, bắt buộc
  workDates: z
    .array(
      z
        .string()
        .regex(DATE_ONLY_REGEX, "Ngày không hợp lệ (định dạng YYYY-MM-DD)"),
    )
    .min(1, "Cần chọn ít nhất 1 ngày"), // Danh sách ngày cần xếp lịch, bắt buộc có ít nhất 1 ngày, mỗi ngày đúng định dạng
});
export type BulkCreateWorkScheduleInput = z.infer<
  typeof bulkCreateWorkScheduleSchema
>; // Type suy ra tự động từ schema

// Validate dữ liệu cập nhật (đổi ca) cho 1 bản ghi lịch làm việc đã có
export const updateWorkScheduleSchema = z.object({
  shiftId: z.string().min(1, "shiftId không được để trống"), // Ca mới muốn đổi sang, bắt buộc (chỉ cho đổi ca, không đổi được ngày)
});
export type UpdateWorkScheduleInput = z.infer<typeof updateWorkScheduleSchema>; // Type suy ra tự động từ schema
