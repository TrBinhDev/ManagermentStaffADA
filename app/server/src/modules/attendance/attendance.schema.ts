// Module: attendance\r\n// Mô tả: Định nghĩa và validate dữ liệu (zod) cho module (chú thích ngắn gọn bằng tiếng Việt)\r\nimport { z } from 'zod';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const checkInSchema = z.object({
  employeeId: z.string().min(1, 'employeeId khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng'),
  shiftId: z.string().min(1, 'shiftId khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng'),
  workDate: z.string().regex(DATE_ONLY_REGEX, 'NgÃ y khÃ´ng há»£p lá»‡ (Ä‘á»‹nh dáº¡ng YYYY-MM-DD)'),
});
export type CheckInInput = z.infer<typeof checkInSchema>;

export const listAttendanceQuerySchema = z.object({
  employeeId: z.string().optional(),
  from: z.string().regex(DATE_ONLY_REGEX, 'NgÃ y khÃ´ng há»£p lá»‡ (Ä‘á»‹nh dáº¡ng YYYY-MM-DD)').optional(),
  to: z.string().regex(DATE_ONLY_REGEX, 'NgÃ y khÃ´ng há»£p lá»‡ (Ä‘á»‹nh dáº¡ng YYYY-MM-DD)').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuerySchema>;

