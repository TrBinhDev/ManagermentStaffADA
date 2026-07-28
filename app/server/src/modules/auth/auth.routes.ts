// Định nghĩa các route liên quan đến xác thực
// /login: đăng nhập, /refresh: làm mới token, /logout: đăng xuất, /me: thông tin user, /change-password: đổi mật khẩu
import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { validate } from '../../validators/validate.js';
import { loginSchema, changePasswordSchema } from './auth.schema.js';
import * as authController from './auth.controller.js';

// Tạo router cho auth
export const authRouter = Router();

// POST /login - đăng nhập, trả access token + lưu refresh token ở cookie
authRouter.post('/login', validate(loginSchema), authController.login);
// POST /refresh - lấy access token mới từ refresh token (cookie)
authRouter.post('/refresh', authController.refresh);
// POST /logout - đăng xuất, cần xác thực
authRouter.post('/logout', authenticate, authController.logout);
// GET /me - lấy thông tin tài khoản hiện tại
authRouter.get('/me', authenticate, authController.me);
// PATCH /change-password - đổi mật khẩu, cần xác thực và validate dữ liệu
authRouter.patch(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);
