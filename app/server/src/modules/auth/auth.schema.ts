import { z } from "zod";
import { Message } from "../../constants/message.js";

// Regex kiểm tra mật khẩu mạnh: tối thiểu 8 ký tự, có ít nhất 1 chữ cái và 1 chữ số
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

// Validate dữ liệu đăng nhập
export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"), // Phải đúng định dạng email
  password: z.string().min(1, "Mật khẩu không được để trống"), // Chỉ cần không rỗng (không check độ mạnh khi login)
});
export type LoginInput = z.infer<typeof loginSchema>; // Type suy ra tự động từ schema

// Validate dữ liệu đổi mật khẩu
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Mật khẩu cũ không được để trống"), // Mật khẩu cũ, chỉ cần không rỗng
  newPassword: z.string().regex(PASSWORD_REGEX, Message.AUTH.WEAK_PASSWORD), // Mật khẩu mới phải đủ mạnh theo PASSWORD_REGEX
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>; // Type suy ra tự động từ schema
