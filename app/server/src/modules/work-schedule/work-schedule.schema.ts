import { z } from 'zod';

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
  shiftId: z.string().min(1, 'shiftId không được để trống'),
  workDates: z
    .array(z.string().regex(DATE_ONLY_REGEX, 'Ngày không hợp lệ (định dạng YYYY-MM-DD)'))
    .min(1, 'Cần chọn ít nhất 1 ngày'),
});
export type BulkCreateWorkScheduleInput = z.infer<typeof bulkCreateWorkScheduleSchema>;

export const updateWorkScheduleSchema = z.object({
  shiftId: z.string().min(1, 'shiftId không được để trống'),
});
export type UpdateWorkScheduleInput = z.infer<typeof updateWorkScheduleSchema>;
