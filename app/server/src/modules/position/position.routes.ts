import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../validators/validate.js";
import {
  listPositionQuerySchema,
  createPositionSchema,
  updatePositionSchema,
} from "./position.schema.js";
import * as positionController from "./position.controller.js";

export const positionRouter = Router();

// Áp dụng cho toàn bộ route bên dưới: phải đăng nhập (authenticate) và chỉ OWNER/MANAGER mới được truy cập module Position
positionRouter.use(authenticate, authorize("OWNER", "MANAGER"));

positionRouter.get(
  "/",
  validate(listPositionQuerySchema, "query"),
  positionController.list,
); // Lấy danh sách vị trí (có filter/search/phân trang)
positionRouter.get("/:id", positionController.getById); // Lấy chi tiết 1 vị trí theo id
positionRouter.post(
  "/",
  validate(createPositionSchema),
  positionController.create,
); // Tạo mới 1 vị trí
positionRouter.patch(
  "/:id",
  validate(updatePositionSchema),
  positionController.update,
); // Cập nhật 1 vị trí theo id
positionRouter.delete("/:id", positionController.remove); // Xóa 1 vị trí theo id
