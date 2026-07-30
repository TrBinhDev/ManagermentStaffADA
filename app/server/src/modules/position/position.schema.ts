import { z } from "zod";

// Schema validate query khi lấy danh sách Position (GET /positions?...)
export const listPositionQuerySchema = z.object({
  departmentId: z.string().optional(), // Lọc theo phòng ban (optional)
  search: z.string().trim().optional(), // Tìm kiếm theo tên (optional)
  isActive: z
    .enum(["true", "false"]) // Query string chỉ nhận string 'true'/'false'
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")), // Convert sang boolean thật
  page: z.coerce.number().int().min(1).default(1), // Trang hiện tại, mặc định 1
  limit: z.coerce.number().int().min(1).max(100).default(20), // Số item/trang, tối đa 100
});
export type ListPositionQuery = z.infer<typeof listPositionQuerySchema>; // Type suy ra từ schema trên

// Schema validate body khi tạo mới Position (POST /positions)
export const createPositionSchema = z.object({
  name: z.string().trim().min(1, "Tên vị trí không được để trống").max(15, "Tên vị trí không được quá 15 kí tự"), // Tên vị trí, bắt buộc
  departmentId: z.string().min(1, "departmentId không được để trống"), // Vị trí phải thuộc 1 phòng ban
});
export type CreatePositionInput = z.infer<typeof createPositionSchema>;

// Schema validate body khi update Position (PATCH /positions/:id) - tất cả field đều optional
export const updatePositionSchema = z.object({
  name: z.string().trim().min(1, "Tên vị trí không được để trống").optional(), // Đổi tên (nếu có)
  departmentId: z.string().min(1).optional(), // Đổi phòng ban (nếu có)
  isActive: z.boolean().optional(), // Bật/tắt trạng thái hoạt động (nếu có)
});
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;
