import { z } from 'zod';

export const listEmployeeQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'RESIGNED']).optional(),
  positionId: z.string().optional(),
  departmentId: z.string().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListEmployeeQuery = z.infer<typeof listEmployeeQuerySchema>;

export const createEmployeeSchema = z.object({
  cccd: z.string().regex(/^\d{12}$/, 'CCCD phải gồm đúng 12 chữ số'),
  fullName: z.string().trim().min(1, 'Họ tên không được để trống'),
  dob: z.coerce.date().optional(),
  positionId: z.string().min(1, 'positionId không được để trống'),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = z.object({
  fullName: z.string().trim().min(1, 'Họ tên không được để trống').optional(),
  dob: z.coerce.date().optional(),
  positionId: z.string().min(1).optional(),
});
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const rehireEmployeeSchema = z.object({
  positionId: z.string().min(1).optional(),
});
export type RehireEmployeeInput = z.infer<typeof rehireEmployeeSchema>;
