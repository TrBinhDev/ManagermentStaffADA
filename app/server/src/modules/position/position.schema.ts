import { z } from 'zod';

export const listPositionQuerySchema = z.object({
  departmentId: z.string().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListPositionQuery = z.infer<typeof listPositionQuerySchema>;

export const createPositionSchema = z.object({
  name: z.string().trim().min(1, 'Tên vị trí không được để trống'),
  departmentId: z.string().min(1, 'departmentId không được để trống'),
});
export type CreatePositionInput = z.infer<typeof createPositionSchema>;

export const updatePositionSchema = z.object({
  name: z.string().trim().min(1, 'Tên vị trí không được để trống').optional(),
  departmentId: z.string().min(1).optional(),
});
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;
