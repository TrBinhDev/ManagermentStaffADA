import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../validators/validate.js";
import {
  listEmployeeWorkScheduleQuerySchema,
  listAllWorkScheduleQuerySchema,
  bulkCreateWorkScheduleSchema,
  updateWorkScheduleSchema,
} from "./work-schedule.schema.js";
import * as workScheduleController from "./work-schedule.controller.js";

// Router lồng theo nhân viên, ví dụ mount ở /employees/:id/work-schedule...
export const workScheduleRouter = Router();

// Chỉ cho OWNER và MANAGER truy cập, phải đăng nhập trước
workScheduleRouter.use(authenticate, authorize("OWNER", "MANAGER"));

// GET /:id/work-schedule - Lấy lịch làm việc của 1 nhân viên theo tháng/năm
workScheduleRouter.get(
  "/:id/work-schedule",
  validate(listEmployeeWorkScheduleQuerySchema, "query"),
  workScheduleController.listByEmployee,
);

// POST /:id/work-schedule/bulk - Xếp lịch hàng loạt (nhiều ngày, 1 ca) cho 1 nhân viên
workScheduleRouter.post(
  "/:id/work-schedule/bulk",
  validate(bulkCreateWorkScheduleSchema),
  workScheduleController.bulkCreate,
);

// PATCH /:id/work-schedule/:scheduleId - Đổi ca cho 1 bản ghi lịch làm việc cụ thể
workScheduleRouter.patch(
  "/:id/work-schedule/:scheduleId",
  validate(updateWorkScheduleSchema),
  workScheduleController.updateShift,
);

// DELETE /:id/work-schedule/:scheduleId - Gỡ 1 bản ghi lịch làm việc
workScheduleRouter.delete(
  "/:id/work-schedule/:scheduleId",
  workScheduleController.remove,
);

// Router riêng dùng để xem lịch làm việc tổng hợp của tất cả nhân viên, ví dụ mount ở /work-schedule
export const workScheduleSummaryRouter = Router();

// Chỉ cho OWNER và MANAGER truy cập, phải đăng nhập trước
workScheduleSummaryRouter.use(authenticate, authorize("OWNER", "MANAGER"));

// GET / - Lấy lịch làm việc tổng hợp của tất cả nhân viên theo tháng/năm, có thể lọc theo ca
workScheduleSummaryRouter.get(
  "/",
  validate(listAllWorkScheduleQuerySchema, "query"),
  workScheduleController.listAll,
);
