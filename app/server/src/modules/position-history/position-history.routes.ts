import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import * as positionHistoryController from "./position-history.controller.js";

export const positionHistoryRouter = Router();

// Chỉ cho OWNER và MANAGER truy cập, phải đăng nhập trước
positionHistoryRouter.use(authenticate, authorize("OWNER", "MANAGER"));

// GET /:id/position-history - Lấy timeline (lịch sử) các vị trí công việc mà 1 nhân viên đã từng giữ theo id
positionHistoryRouter.get(
  "/:id/position-history",
  positionHistoryController.getTimeline,
);
