import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../validators/validate.js";
import {
  createCapacitySchema,
  updateCapacitySchema,
} from "./shift-position-capacity.schema.js";
import * as capacityController from "./shift-position-capacity.controller.js";

export const shiftPositionCapacityRouter = Router();

// Chỉ cho OWNER và MANAGER truy cập, phải đăng nhập trước
shiftPositionCapacityRouter.use(authenticate, authorize("OWNER", "MANAGER"));

// GET /:id/capacities - Lấy danh sách giới hạn nhân sự của ca làm việc (id = shiftId), không validate vì không có input ngoài param
shiftPositionCapacityRouter.get("/:id/capacities", capacityController.list);

// POST /:id/capacities - Tạo giới hạn mới cho 1 vị trí trong ca này, validate body
shiftPositionCapacityRouter.post(
  "/:id/capacities",
  validate(createCapacitySchema),
  capacityController.create,
);

// PATCH /:id/capacities/:capacityId - Cập nhật giới hạn (chỉ sửa maxStaff) theo id ca + id giới hạn, validate body
shiftPositionCapacityRouter.patch(
  "/:id/capacities/:capacityId",
  validate(updateCapacitySchema),
  capacityController.update,
);

// DELETE /:id/capacities/:capacityId - Xóa giới hạn theo id ca + id giới hạn
shiftPositionCapacityRouter.delete(
  "/:id/capacities/:capacityId",
  capacityController.remove,
);
