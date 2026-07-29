import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../validators/validate.js";
import {
  listShiftQuerySchema,
  createShiftSchema,
  updateShiftSchema,
} from "./shift.schema.js";
import * as shiftController from "./shift.controller.js";

export const shiftRouter = Router();

// Chỉ cho OWNER và MANAGER truy cập, phải đăng nhập trước
shiftRouter.use(authenticate, authorize("OWNER", "MANAGER"));

// GET / - Lấy danh sách ca làm việc, validate query (lọc/phân trang)
shiftRouter.get(
  "/",
  validate(listShiftQuerySchema, "query"),
  shiftController.list,
);

// GET /:id - Lấy chi tiết 1 ca làm việc theo id
shiftRouter.get("/:id", shiftController.getById);

// POST / - Tạo mới ca làm việc, validate body
shiftRouter.post("/", validate(createShiftSchema), shiftController.create);

// PATCH /:id - Cập nhật ca làm việc theo id, validate body
shiftRouter.patch("/:id", validate(updateShiftSchema), shiftController.update);

// DELETE /:id - Xóa ca làm việc theo id
shiftRouter.delete("/:id", shiftController.remove);
