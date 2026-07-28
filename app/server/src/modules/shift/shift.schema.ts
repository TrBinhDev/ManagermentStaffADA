// Module: shift\r\n// Mô tả: Định nghĩa và validate dữ liệu (zod) cho module (chú thích ngắn gọn bằng tiếng Việt)\r\nimport { z } from 'zod';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const listShiftQuerySchema = z.object({
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListShiftQuery = z.infer<typeof listShiftQuerySchema>;

export const createShiftSchema = z.object({
  name: z.string().trim().min(1, 'TÃªn ca lÃ m viá»‡c khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng'),
  startTime: z.string().regex(TIME_REGEX, 'Giá» báº¯t Ä‘áº§u khÃ´ng há»£p lá»‡ (Ä‘á»‹nh dáº¡ng HH:MM)'),
  endTime: z.string().regex(TIME_REGEX, 'Giá» káº¿t thÃºc khÃ´ng há»£p lá»‡ (Ä‘á»‹nh dáº¡ng HH:MM)'),
});
export type CreateShiftInput = z.infer<typeof createShiftSchema>;

export const updateShiftSchema = z.object({
  name: z.string().trim().min(1, 'TÃªn ca lÃ m viá»‡c khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng').optional(),
  startTime: z.string().regex(TIME_REGEX, 'Giá» báº¯t Ä‘áº§u khÃ´ng há»£p lá»‡ (Ä‘á»‹nh dáº¡ng HH:MM)').optional(),
  endTime: z.string().regex(TIME_REGEX, 'Giá» káº¿t thÃºc khÃ´ng há»£p lá»‡ (Ä‘á»‹nh dáº¡ng HH:MM)').optional(),
  isActive: z.boolean().optional(),
});
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;

