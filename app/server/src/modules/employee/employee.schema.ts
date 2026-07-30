import { z } from "zod";

// Validate query khi lấy danh sách nhân viên (lọc + tìm kiếm + phân trang)
export const listEmployeeQuerySchema = z.object({
  status: z.enum(["ACTIVE", "RESIGNED"]).optional(), // Lọc theo trạng thái: đang làm / đã nghỉ
  positionId: z.string().optional(), // Lọc theo vị trí công việc
  departmentId: z.string().optional(), // Lọc theo phòng ban
  search: z.string().trim().optional(), // Tìm kiếm theo tên/mã nhân viên
  page: z.coerce.number().int().min(1).default(1), // Số trang, mặc định trang 1
  limit: z.coerce.number().int().min(1).max(100).default(20), // Số bản ghi mỗi trang, tối đa 100, mặc định 20
});
export type ListEmployeeQuery = z.infer<typeof listEmployeeQuerySchema>; // Type suy ra tự động từ schema

// Validate dữ liệu tạo mới nhân viên
export const createEmployeeSchema = z.object({
  cccd: z.string().regex(/^\d{12}$/, "CCCD phải gồm đúng 12 chữ số"), // Số CCCD, bắt buộc đúng 12 chữ số
  fullName: z.string().trim().min(1, "Họ tên không được để trống").max(20, "Tên không được quá 20 ký tự"), // Họ tên, bắt buộc
  dob: z.coerce.date().optional(), // Ngày sinh, không bắt buộc, tự ép kiểu từ string sang Date
  positionId: z.string().min(1, "positionId không được để trống"), // Vị trí công việc ban đầu, bắt buộc
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>; // Type suy ra tự động từ schema

// Validate dữ liệu cập nhật nhân viên (cho phép cập nhật một phần)
export const updateEmployeeSchema = z.object({
  fullName: z.string().trim().min(1, "Họ tên không được để trống").optional(), // Họ tên, không bắt buộc
  dob: z.coerce.date().optional(), // Ngày sinh, không bắt buộc
  positionId: z.string().min(1).optional(), // Vị trí công việc, không bắt buộc (có thể đổi vị trí)
});
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>; // Type suy ra tự động từ schema

// Validate dữ liệu khi thuê lại nhân viên đã nghỉ việc
export const rehireEmployeeSchema = z.object({
  positionId: z.string().min(1).optional(), // Vị trí mới khi thuê lại (nếu không truyền thì giữ vị trí cũ)
});
export type RehireEmployeeInput = z.infer<typeof rehireEmployeeSchema>; // Type suy ra tự động từ schema
