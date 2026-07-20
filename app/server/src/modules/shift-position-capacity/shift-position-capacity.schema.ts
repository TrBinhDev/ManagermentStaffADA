import { z } from 'zod';

export const createCapacitySchema = z.object({
  positionId: z.string().min(1, 'positionId không được để trống'),
  maxStaff: z.number().int().positive('Giới hạn số người phải lớn hơn 0'),
});
export type CreateCapacityInput = z.infer<typeof createCapacitySchema>;

export const updateCapacitySchema = z.object({
  maxStaff: z.number().int().positive('Giới hạn số người phải lớn hơn 0'),
});
export type UpdateCapacityInput = z.infer<typeof updateCapacitySchema>;
