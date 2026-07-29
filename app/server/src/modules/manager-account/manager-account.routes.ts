import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../validators/validate.js";
import {
  listManagerAccountQuerySchema,
  createManagerAccountSchema,
  updateManagerAccountSchema,
  resetPasswordSchema,
} from "./manager-account.schema.js";
import * as managerAccountController from "./manager-account.controller.js";

export const managerAccountRouter = Router();

// Chỉ cho OWNER truy cập (khác các router trước đó cho cả OWNER+MANAGER)
// -> quản lý tài khoản đăng nhập là quyền hạn cao nhất, chỉ chủ sở hữu mới được phép
managerAccountRouter.use(authenticate, authorize("OWNER"));

// GET / - Lấy danh sách tài khoản quản lý, validate query (lọc/phân trang)
managerAccountRouter.get(
  "/",
  validate(listManagerAccountQuerySchema, "query"),
  managerAccountController.list,
);

// GET /:id - Lấy chi tiết 1 tài khoản theo id
managerAccountRouter.get("/:id", managerAccountController.getById);

// POST / - Tạo mới tài khoản quản lý, validate body
managerAccountRouter.post(
  "/",
  validate(createManagerAccountSchema),
  managerAccountController.create,
);

// PATCH /:id - Cập nhật tài khoản theo id, validate body
managerAccountRouter.patch(
  "/:id",
  validate(updateManagerAccountSchema),
  managerAccountController.update,
);

// PATCH /:id/reset-password - Đặt lại mật khẩu cho tài khoản theo id, validate body
managerAccountRouter.patch(
  "/:id/reset-password",
  validate(resetPasswordSchema),
  managerAccountController.resetPassword,
);

// DELETE /:id - Xóa tài khoản theo id
managerAccountRouter.delete("/:id", managerAccountController.remove);
