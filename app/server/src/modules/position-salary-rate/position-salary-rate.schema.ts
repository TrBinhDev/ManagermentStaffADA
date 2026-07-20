import { z } from 'zod';

export const createSalaryRateSchema = z.object({
  hourlyRate: z.number().positive('Mức lương phải lớn hơn 0'),
});
export type CreateSalaryRateInput = z.infer<typeof createSalaryRateSchema>;
