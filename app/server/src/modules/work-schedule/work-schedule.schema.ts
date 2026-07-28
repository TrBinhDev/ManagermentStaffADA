// Module: work-schedule\r\n// Mô tả: Định nghĩa và validate dữ liệu (zod) cho module (chú thích ngắn gọn bằng tiếng Việt)\r\nimport { z } from 'zod';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const listEmployeeWorkScheduleQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});
export type ListEmployeeWorkScheduleQuery = z.infer<typeof listEmployeeWorkScheduleQuerySchema>;

export const listAllWorkScheduleQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  shiftId: z.string().optional(),
});
export type ListAllWorkScheduleQuery = z.infer<typeof listAllWorkScheduleQuerySchema>;

export const bulkCreateWorkScheduleSchema = z.object({
  shiftId: z.string().min(1, 'shiftId khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng'),
  workDates: z
    .array(z.string().regex(DATE_ONLY_REGEX, 'NgÃ y khÃ´ng há»£p lá»‡ (Ä‘á»‹nh dáº¡ng YYYY-MM-DD)'))
    .min(1, 'Cáº§n chá»n Ã­t nháº¥t 1 ngÃ y'),
});
export type BulkCreateWorkScheduleInput = z.infer<typeof bulkCreateWorkScheduleSchema>;

export const updateWorkScheduleSchema = z.object({
  shiftId: z.string().min(1, 'shiftId khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng'),
});
export type UpdateWorkScheduleInput = z.infer<typeof updateWorkScheduleSchema>;

