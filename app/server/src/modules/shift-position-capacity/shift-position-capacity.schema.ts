// Module: shift-position-capacity\r\n// Mô tả: Định nghĩa và validate dữ liệu (zod) cho module (chú thích ngắn gọn bằng tiếng Việt)\r\nimport { z } from 'zod';

export const createCapacitySchema = z.object({
  positionId: z.string().min(1, 'positionId khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng'),
  maxStaff: z.number().int().positive('Giá»›i háº¡n sá»‘ ngÆ°á»i pháº£i lá»›n hÆ¡n 0'),
});
export type CreateCapacityInput = z.infer<typeof createCapacitySchema>;

export const updateCapacitySchema = z.object({
  maxStaff: z.number().int().positive('Giá»›i háº¡n sá»‘ ngÆ°á»i pháº£i lá»›n hÆ¡n 0'),
});
export type UpdateCapacityInput = z.infer<typeof updateCapacitySchema>;

