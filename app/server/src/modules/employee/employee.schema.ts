// Module: employee\r\n// Mô tả: Định nghĩa và validate dữ liệu (zod) cho module (chú thích ngắn gọn bằng tiếng Việt)\r\nimport { z } from 'zod';

export const listEmployeeQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'RESIGNED']).optional(),
  positionId: z.string().optional(),
  departmentId: z.string().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListEmployeeQuery = z.infer<typeof listEmployeeQuerySchema>;

export const createEmployeeSchema = z.object({
  cccd: z.string().regex(/^\d{12}$/, 'CCCD pháº£i gá»“m Ä‘Ãºng 12 chá»¯ sá»‘'),
  fullName: z.string().trim().min(1, 'Há» tÃªn khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng'),
  dob: z.coerce.date().optional(),
  positionId: z.string().min(1, 'positionId khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng'),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = z.object({
  fullName: z.string().trim().min(1, 'Há» tÃªn khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng').optional(),
  dob: z.coerce.date().optional(),
  positionId: z.string().min(1).optional(),
});
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const rehireEmployeeSchema = z.object({
  positionId: z.string().min(1).optional(),
});
export type RehireEmployeeInput = z.infer<typeof rehireEmployeeSchema>;

