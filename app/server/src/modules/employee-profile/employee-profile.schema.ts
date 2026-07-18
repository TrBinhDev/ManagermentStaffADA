import { z } from 'zod';

export const upsertEmployeeProfileSchema = z.object({
  cccd: z.string().regex(/^\d{12}$/, 'CCCD phải gồm đúng 12 chữ số').optional(),
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
  cccdIssueDate: z.coerce.date().optional(),
  cccdIssuePlace: z.string().trim().optional(),
  bankName: z.string().trim().optional(),
  bankAccountNumber: z.string().trim().optional(),
  bankAccountHolder: z.string().trim().optional(),
  note: z.string().optional(),
});
export type UpsertEmployeeProfileInput = z.infer<typeof upsertEmployeeProfileSchema>;
