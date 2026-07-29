import { z } from "zod";

// Regex kiểm tra định dạng giờ HH:MM (00:00 - 23:59)
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// Validate query khi lấy danh sách ca làm việc (lọc + phân trang)
export const listShiftQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")), // Lọc theo trạng thái hoạt động, nhận string từ query rồi chuyển thành boolean thật
  page: z.coerce.number().int().min(1).default(1), // Số trang, mặc định trang 1
  limit: z.coerce.number().int().min(1).max(100).default(20), // Số bản ghi mỗi trang, tối đa 100, mặc định 20
});
export type ListShiftQuery = z.infer<typeof listShiftQuerySchema>; // Type suy ra tự động từ schema

// Validate dữ liệu tạo mới ca làm việc
export const createShiftSchema = z.object({
  name: z.string().trim().min(1, "Tên ca làm việc không được để trống"), // Tên ca, bắt buộc
  startTime: z
    .string()
    .regex(TIME_REGEX, "Giờ bắt đầu không hợp lệ (định dạng HH:MM)"), // Giờ bắt đầu, bắt buộc đúng định dạng HH:MM
  endTime: z
    .string()
    .regex(TIME_REGEX, "Giờ kết thúc không hợp lệ (định dạng HH:MM)"), // Giờ kết thúc, bắt buộc đúng định dạng HH:MM
});
export type CreateShiftInput = z.infer<typeof createShiftSchema>; // Type suy ra tự động từ schema

// Validate dữ liệu cập nhật ca làm việc (cho phép cập nhật một phần)
export const updateShiftSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên ca làm việc không được để trống")
    .optional(), // Tên ca, không bắt buộc
  startTime: z
    .string()
    .regex(TIME_REGEX, "Giờ bắt đầu không hợp lệ (định dạng HH:MM)")
    .optional(), // Giờ bắt đầu, không bắt buộc
  endTime: z
    .string()
    .regex(TIME_REGEX, "Giờ kết thúc không hợp lệ (định dạng HH:MM)")
    .optional(), // Giờ kết thúc, không bắt buộc
  isActive: z.boolean().optional(), // Bật/tắt trạng thái hoạt động của ca
});
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>; // Type suy ra tự động từ schema
