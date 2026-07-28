// Module: department\r\n// Mô tả: Định nghĩa và validate dữ liệu (zod) cho module (chú thích ngắn gọn bằng tiếng Việt)\r\nimport { z } from 'zod';

export const listDepartmentQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListDepartmentQuery = z.infer<typeof listDepartmentQuerySchema>;

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, 'TÃªn phÃ²ng ban khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng'),
});
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(1, 'TÃªn phÃ²ng ban khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng').optional(),
});
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

