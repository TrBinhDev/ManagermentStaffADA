import { z } from "zod";

// Validate query khi lấy danh sách lương ngày của 1 nhân viên (lọc theo tháng/năm)
export const listEmployeePaymentsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12), // Tháng, ép kiểu từ string sang number, trong khoảng 1-12
  year: z.coerce.number().int().min(2000).max(2100), // Năm, ép kiểu từ string sang number, trong khoảng 2000-2100
});
export type ListEmployeePaymentsQuery = z.infer<
  typeof listEmployeePaymentsQuerySchema
>; // Type suy ra tự động từ schema

// Validate query khi chỉ cần tổng lương toàn nhà hàng trong tháng (KHÔNG phân trang -
// đây là 1 con số duy nhất, tách riêng khỏi listAll để không phải tính lại mỗi lần đổi trang/sort)
export const summaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12), // Tháng, bắt buộc
  year: z.coerce.number().int().min(2000).max(2100), // Năm, bắt buộc
});
export type SummaryQuery = z.infer<typeof summaryQuerySchema>; // Type suy ra tự động từ schema

// Validate query khi lấy danh sách lương ngày của tất cả nhân viên (lọc theo tháng/năm, tìm theo tên,
// sort theo tên hoặc theo tổng lương, có phân trang)
export const listAllPaymentsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12), // Tháng, bắt buộc
  year: z.coerce.number().int().min(2000).max(2100), // Năm, bắt buộc
  employeeId: z.string().optional(), // Lọc đúng 1 nhân viên, không bắt buộc
  search: z.string().trim().optional(), // Tìm theo tên nhân viên, không bắt buộc
  // "name" = phân trang nhẹ ở tầng Employee trước (mặc định). "amount" = phải tính tổng lương
  // cho toàn bộ nhân viên khớp filter rồi mới sort + cắt trang -> nặng hơn, chỉ chạy khi user chủ động chọn.
  sortBy: z.enum(["name", "amount"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1), // Số trang, mặc định trang 1
  limit: z.coerce.number().int().min(1).max(100).default(20), // Số bản ghi mỗi trang, tối đa 100, mặc định 20
});
export type ListAllPaymentsQuery = z.infer<typeof listAllPaymentsQuerySchema>; // Type suy ra tự động từ schema
