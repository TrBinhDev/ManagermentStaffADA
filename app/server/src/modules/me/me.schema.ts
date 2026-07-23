import { z } from 'zod';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const meAttendanceQuerySchema = z.object({
  from: z.string().regex(DATE_ONLY_REGEX, 'Ngày không hợp lệ (định dạng YYYY-MM-DD)').optional(),
  to: z.string().regex(DATE_ONLY_REGEX, 'Ngày không hợp lệ (định dạng YYYY-MM-DD)').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type MeAttendanceQuery = z.infer<typeof meAttendanceQuerySchema>;

export const meUpdateProfileSchema = z.object({
  gender: z.string().trim().optional(),
  ethnicity: z.string().trim().optional(),
  religion: z.string().trim().optional(),
  permanentAddress: z.string().trim().optional(),
  currentAddress: z.string().trim().optional(),
  primaryPhone: z.string().trim().optional(),
  email: z.string().email('Email không hợp lệ').optional(),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
  emergencyContactRelation: z.string().trim().optional(),
  maritalStatus: z.string().trim().optional(),
  educationLevel: z.string().trim().optional(),
  bankName: z.string().trim().optional(),
  bankAccountNumber: z.string().trim().optional(),
  bankAccountHolder: z.string().trim().optional(),
});
export type MeUpdateProfileInput = z.infer<typeof meUpdateProfileSchema>;
