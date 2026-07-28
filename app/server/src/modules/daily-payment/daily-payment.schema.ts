// Module: daily-payment\r\n// Mô tả: Định nghĩa và validate dữ liệu (zod) cho module (chú thích ngắn gọn bằng tiếng Việt)\r\nimport { z } from 'zod';

export const listEmployeePaymentsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});
export type ListEmployeePaymentsQuery = z.infer<typeof listEmployeePaymentsQuerySchema>;

export const listAllPaymentsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  employeeId: z.string().optional(),
});
export type ListAllPaymentsQuery = z.infer<typeof listAllPaymentsQuerySchema>;

