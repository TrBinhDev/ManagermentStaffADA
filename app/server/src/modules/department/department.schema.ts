import { z } from "zod";

// Validate query khi lấy danh sách phòng ban (tìm kiếm + phân trang)
export const listDepartmentQuerySchema = z.object({
  search: z.string().trim().optional(), // Từ khóa tìm kiếm theo tên, không bắt buộc, tự động cắt khoảng trắng thừa
  page: z.coerce.number().int().min(1).default(1), // Số trang, ép kiểu sang number, mặc định trang 1
  limit: z.coerce.number().int().min(1).max(100).default(20), // Số bản ghi mỗi trang, tối đa 100, mặc định 20
});
export type ListDepartmentQuery = z.infer<typeof listDepartmentQuerySchema>; // Type suy ra tự động từ schema

// Validate dữ liệu tạo mới phòng ban
export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, "Tên phòng ban không được để trống"), // Tên phòng ban, bắt buộc, không được rỗng sau khi cắt khoảng trắng
});
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>; // Type suy ra tự động từ schema

// Validate dữ liệu cập nhật phòng ban
export const updateDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên phòng ban không được để trống")
    .optional(), // Tên phòng ban, không bắt buộc (cho phép cập nhật 1 phần)
});
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>; // Type suy ra tự động từ schema
