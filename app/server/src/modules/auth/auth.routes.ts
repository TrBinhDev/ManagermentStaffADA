import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { validate } from "../../validators/validate.js";
import { loginSchema, changePasswordSchema } from "./auth.schema.js";
import * as authController from "./auth.controller.js";

export const authRouter = Router();

// POST /login - Đăng nhập, validate body (email/password) trước khi vào controller, không cần đăng nhập trước
authRouter.post("/login", validate(loginSchema), authController.login);

// POST /refresh - Làm mới access token bằng refresh token trong cookie, không cần middleware authenticate (vì access token đã hết hạn)
authRouter.post("/refresh", authController.refresh);

// POST /logout - Đăng xuất, yêu cầu đã đăng nhập (có access token hợp lệ)
authRouter.post("/logout", authenticate, authController.logout);

// GET /me - Lấy thông tin tài khoản đang đăng nhập, yêu cầu đã đăng nhập
authRouter.get("/me", authenticate, authController.me);

// PATCH /change-password - Đổi mật khẩu, yêu cầu đã đăng nhập + validate body (mật khẩu cũ/mới)
authRouter.patch(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);
