import { z } from "zod";

// Validate dữ liệu tạo mới giới hạn số người cho 1 cặp (ca làm việc, vị trí)
export const createCapacitySchema = z.object({
  positionId: z.string().min(1, "positionId không được để trống"), // Vị trí công việc cần giới hạn, bắt buộc
  maxStaff: z.number().int().positive("Giới hạn số người phải lớn hơn 0"), // Số người tối đa, bắt buộc là số nguyên dương
});
export type CreateCapacityInput = z.infer<typeof createCapacitySchema>; // Type suy ra tự động từ schema

// Validate dữ liệu cập nhật giới hạn số người
// Không có positionId vì không cho đổi vị trí của 1 giới hạn đã tạo (muốn đổi thì xóa rồi tạo lại,
// vì cặp (shiftId, positionId) là unique nên đổi positionId có thể đụng ràng buộc unique với bản ghi khác)
export const updateCapacitySchema = z.object({
  maxStaff: z.number().int().positive("Giới hạn số người phải lớn hơn 0"), // Số người tối đa, bắt buộc là số nguyên dương (không optional vì đây là trường duy nhất có thể sửa)
});
export type UpdateCapacityInput = z.infer<typeof updateCapacitySchema>; // Type suy ra tự động từ schema
