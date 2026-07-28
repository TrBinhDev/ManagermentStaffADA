// Module: position\r\n// Mô tả: Định nghĩa và validate dữ liệu (zod) cho module (chú thích ngắn gọn bằng tiếng Việt)\r\nimport { z } from 'zod';

export const listPositionQuerySchema = z.object({
  departmentId: z.string().optional(),
  search: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListPositionQuery = z.infer<typeof listPositionQuerySchema>;

export const createPositionSchema = z.object({
  name: z.string().trim().min(1, 'TÃªn vá»‹ trÃ­ khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng'),
  departmentId: z.string().min(1, 'departmentId khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng'),
});
export type CreatePositionInput = z.infer<typeof createPositionSchema>;

export const updatePositionSchema = z.object({
  name: z.string().trim().min(1, 'TÃªn vá»‹ trÃ­ khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng').optional(),
  departmentId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;

