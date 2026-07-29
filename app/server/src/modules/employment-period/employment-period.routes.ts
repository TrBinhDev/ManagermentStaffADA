import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import * as employmentPeriodController from "./employment-period.controller.js";

export const employmentPeriodRouter = Router();

// Chỉ cho OWNER và MANAGER truy cập, phải đăng nhập trước
employmentPeriodRouter.use(authenticate, authorize("OWNER", "MANAGER"));

// GET /:id/employment-periods - Lấy timeline (lịch sử) các giai đoạn gắn bó của 1 nhân viên theo id
employmentPeriodRouter.get(
  "/:id/employment-periods",
  employmentPeriodController.getTimeline,
);
