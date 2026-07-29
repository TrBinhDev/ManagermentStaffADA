import { z } from "zod";

// Validate dữ liệu tạo mới mức lương theo giờ cho 1 vị trí
export const createSalaryRateSchema = z.object({
  hourlyRate: z.number().positive("Mức lương phải lớn hơn 0"), // Đơn giá lương/giờ, bắt buộc phải là số dương
});
export type CreateSalaryRateInput = z.infer<typeof createSalaryRateSchema>; // Type suy ra tự động từ schema
