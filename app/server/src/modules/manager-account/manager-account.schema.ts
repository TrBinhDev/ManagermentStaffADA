// Module: manager-account\r\n// Mô tả: Định nghĩa và validate dữ liệu (zod) cho module (chú thích ngắn gọn bằng tiếng Việt)\r\nimport { z } from "zod";
import { Message } from "../../constants/message.js";

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const listManagerAccountQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  role: z.enum(["OWNER", "MANAGER", "STAFF"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListManagerAccountQuery = z.infer<
  typeof listManagerAccountQuerySchema
>;

export const createManagerAccountSchema = z
  .object({
    email: z.string().email("Email khÃ´ng há»£p lá»‡"),
    password: z.string().regex(PASSWORD_REGEX, Message.AUTH.WEAK_PASSWORD),
    role: z.enum(["MANAGER", "STAFF"]),
    employeeId: z.string().min(1).optional(),
  })
  .refine((data) => data.role !== 'STAFF' || !!data.employeeId, {
    message: 'TÃ i khoáº£n STAFF báº¯t buá»™c pháº£i gáº¯n vá»›i 1 nhÃ¢n viÃªn',
    path: ['employeeId'],
  });
export type CreateManagerAccountInput = z.infer<
  typeof createManagerAccountSchema
>;

export const updateManagerAccountSchema = z.object({
  isActive: z.boolean().optional(),
  email: z.string().email("Email khÃ´ng há»£p lá»‡").optional(),
  role: z.enum(["MANAGER", "STAFF"]).optional(),
  employeeId: z.string().min(1).nullable().optional(),
});
export type UpdateManagerAccountInput = z.infer<
  typeof updateManagerAccountSchema
>;

export const resetPasswordSchema = z.object({
  newPassword: z.string().regex(PASSWORD_REGEX, Message.AUTH.WEAK_PASSWORD),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

