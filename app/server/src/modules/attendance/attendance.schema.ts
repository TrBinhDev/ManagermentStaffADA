import { z } from 'zod';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const checkInSchema = z.object({
  employeeId: z.string().min(1, 'employeeId không được để trống'),
  shiftId: z.string().min(1, 'shiftId không được để trống'),
  workDate: z.string().regex(DATE_ONLY_REGEX, 'Ngày không hợp lệ (định dạng YYYY-MM-DD)'),
});
export type CheckInInput = z.infer<typeof checkInSchema>;

export const listAttendanceQuerySchema = z.object({
  employeeId: z.string().optional(),
  from: z.string().regex(DATE_ONLY_REGEX, 'Ngày không hợp lệ (định dạng YYYY-MM-DD)').optional(),
  to: z.string().regex(DATE_ONLY_REGEX, 'Ngày không hợp lệ (định dạng YYYY-MM-DD)').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuerySchema>;
