import { z } from "zod";

// Validate query khi lấy danh sách lương ngày của 1 nhân viên (lọc theo tháng/năm)
export const listEmployeePaymentsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12), // Tháng, ép kiểu từ string sang number, trong khoảng 1-12
  year: z.coerce.number().int().min(2000).max(2100), // Năm, ép kiểu từ string sang number, trong khoảng 2000-2100
});
export type ListEmployeePaymentsQuery = z.infer<
  typeof listEmployeePaymentsQuerySchema
>; // Type suy ra tự động từ schema

// Validate query khi lấy danh sách lương ngày của tất cả nhân viên (lọc theo tháng/năm, có thể lọc thêm theo nhân viên)
export const listAllPaymentsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12), // Tháng, bắt buộc
  year: z.coerce.number().int().min(2000).max(2100), // Năm, bắt buộc
  employeeId: z.string().optional(), // Lọc theo nhân viên, không bắt buộc
});
export type ListAllPaymentsQuery = z.infer<typeof listAllPaymentsQuerySchema>; // Type suy ra tự động từ schema
