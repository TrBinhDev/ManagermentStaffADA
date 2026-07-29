import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../validators/validate.js";
import {
  listDepartmentQuerySchema,
  createDepartmentSchema,
  updateDepartmentSchema,
} from "./department.schema.js";
import * as departmentController from "./department.controller.js";

export const departmentRouter = Router();

// Chỉ cho OWNER và MANAGER truy cập, phải đăng nhập trước
departmentRouter.use(authenticate, authorize("OWNER", "MANAGER"));

// GET / - Lấy danh sách phòng ban, validate query (tìm kiếm/phân trang)
departmentRouter.get(
  "/",
  validate(listDepartmentQuerySchema, "query"),
  departmentController.list,
);

// GET /:id - Lấy chi tiết 1 phòng ban theo id (không validate vì không có input ngoài param)
departmentRouter.get("/:id", departmentController.getById);

// POST / - Tạo mới phòng ban, validate body trước khi vào controller
departmentRouter.post(
  "/",
  validate(createDepartmentSchema),
  departmentController.create,
);

// PATCH /:id - Cập nhật phòng ban theo id, validate body trước khi vào controller
departmentRouter.patch(
  "/:id",
  validate(updateDepartmentSchema),
  departmentController.update,
);

// DELETE /:id - Xóa phòng ban theo id
departmentRouter.delete("/:id", departmentController.remove);
