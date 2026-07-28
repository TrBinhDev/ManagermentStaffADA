// Module: position-salary-rate\r\n// Mô tả: Định nghĩa và validate dữ liệu (zod) cho module (chú thích ngắn gọn bằng tiếng Việt)\r\nimport { z } from 'zod';

export const createSalaryRateSchema = z.object({
  hourlyRate: z.number().positive('Má»©c lÆ°Æ¡ng pháº£i lá»›n hÆ¡n 0'),
});
export type CreateSalaryRateInput = z.infer<typeof createSalaryRateSchema>;

