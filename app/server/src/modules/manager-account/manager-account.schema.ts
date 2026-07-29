import { z } from "zod";
import { Message } from "../../constants/message.js";

// Regex kiểm tra mật khẩu mạnh: tối thiểu 8 ký tự, có ít nhất 1 chữ cái và 1 chữ số
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

// Validate query khi lấy danh sách tài khoản quản lý (lọc + phân trang)
export const listManagerAccountQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")), // Lọc theo trạng thái hoạt động, nhận string từ query rồi chuyển thành boolean thật
  role: z.enum(["OWNER", "MANAGER", "STAFF"]).optional(), // Lọc theo vai trò
  page: z.coerce.number().int().min(1).default(1), // Số trang, mặc định trang 1
  limit: z.coerce.number().int().min(1).max(100).default(20), // Số bản ghi mỗi trang, tối đa 100, mặc định 20
});
export type ListManagerAccountQuery = z.infer<
  typeof listManagerAccountQuerySchema
>; // Type suy ra tự động từ schema

// Validate dữ liệu tạo mới tài khoản quản lý
export const createManagerAccountSchema = z
  .object({
    email: z.string().email("Email không hợp lệ"), // Email đăng nhập, bắt buộc đúng định dạng
    password: z.string().regex(PASSWORD_REGEX, Message.AUTH.WEAK_PASSWORD), // Mật khẩu, bắt buộc đủ mạnh
    role: z.enum(["MANAGER", "STAFF"]), // Vai trò khi tạo mới (không cho tạo OWNER qua API này)
    employeeId: z.string().min(1).optional(), // Gắn với 1 nhân viên, không bắt buộc (trừ khi role là STAFF)
  })
  .refine((data) => data.role !== 'STAFF' || !!data.employeeId, {
    // Ràng buộc thêm: nếu role là STAFF thì bắt buộc phải có employeeId
    message: 'Tài khoản STAFF bắt buộc phải gắn với 1 nhân viên',
    path: ['employeeId'], // Gắn lỗi vào trường employeeId để hiển thị đúng chỗ
  });
export type CreateManagerAccountInput = z.infer<
  typeof createManagerAccountSchema
>; // Type suy ra tự động từ schema

// Validate dữ liệu cập nhật tài khoản quản lý (cho phép cập nhật một phần)
export const updateManagerAccountSchema = z.object({
  isActive: z.boolean().optional(), // Bật/tắt trạng thái hoạt động của tài khoản
  email: z.string().email("Email không hợp lệ").optional(), // Đổi email
  role: z.enum(["MANAGER", "STAFF"]).optional(), // Đổi vai trò (không cho đổi thành OWNER qua API này)
  employeeId: z.string().min(1).nullable().optional(), // Đổi/gỡ liên kết nhân viên: có giá trị = đổi, null = gỡ liên kết, không truyền = giữ nguyên
});
export type UpdateManagerAccountInput = z.infer<
  typeof updateManagerAccountSchema
>; // Type suy ra tự động từ schema

// Validate dữ liệu khi đặt lại mật khẩu cho tài khoản (do OWNER/MANAGER thực hiện, không phải người dùng tự đổi)
export const resetPasswordSchema = z.object({
  newPassword: z.string().regex(PASSWORD_REGEX, Message.AUTH.WEAK_PASSWORD), // Mật khẩu mới, bắt buộc đủ mạnh
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>; // Type suy ra tự động từ schema