import { z } from 'zod';

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
  name: z.string().trim().min(1, 'Tên ca làm việc không được để trống'),
  startTime: z.string().regex(TIME_REGEX, 'Giờ bắt đầu không hợp lệ (định dạng HH:MM)'),
  endTime: z.string().regex(TIME_REGEX, 'Giờ kết thúc không hợp lệ (định dạng HH:MM)'),
});
export type CreateShiftInput = z.infer<typeof createShiftSchema>;

export const updateShiftSchema = z.object({
  name: z.string().trim().min(1, 'Tên ca làm việc không được để trống').optional(),
  startTime: z.string().regex(TIME_REGEX, 'Giờ bắt đầu không hợp lệ (định dạng HH:MM)').optional(),
  endTime: z.string().regex(TIME_REGEX, 'Giờ kết thúc không hợp lệ (định dạng HH:MM)').optional(),
  isActive: z.boolean().optional(),
});
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;
