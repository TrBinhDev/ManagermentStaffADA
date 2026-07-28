// Schema và xác thực dữ liệu cho các endpoint auth
// PASSWORD_REGEX: ít nhất 8 ký tự, chứa chữ và số
import { z } from 'zod';
import { Message } from '../../constants/message.js';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const loginSchema = z.object({
  // email phải hợp lệ
  email: z.string().email('Email không hợp lệ'),
  // password không được rỗng
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  // mật khẩu hiện tại (bắt buộc)
  oldPassword: z.string().min(1, 'Mật khẩu cũ không được để trống'),
  // mật khẩu mới phải đáp ứng quy tắc PASSWORD_REGEX
  newPassword: z.string().regex(PASSWORD_REGEX, Message.AUTH.WEAK_PASSWORD),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
