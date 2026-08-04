import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../validators/validate.js";
import { uploadAvatarMiddleware } from "../../middlewares/upload-avatar.middleware.js";
import { listEmployeeWorkScheduleQuerySchema } from "../work-schedule/work-schedule.schema.js";
import { listEmployeePaymentsQuerySchema } from "../daily-payment/daily-payment.schema.js";
import { meAttendanceQuerySchema, meUpdateProfileSchema } from "./me.schema.js";
import * as meController from "./me.controller.js";

export const meRouter = Router();

// Chỉ cho STAFF truy cập (khác các router trước cho OWNER/MANAGER) — đây là router nhân viên tự dùng cho chính mình
meRouter.use(authenticate, authorize("STAFF"));

// GET /work-schedule - Xem lịch làm việc của chính mình, tái sử dụng schema validate từ module work-schedule
meRouter.get(
  "/work-schedule",
  validate(listEmployeeWorkScheduleQuerySchema, "query"),
  meController.listWorkSchedule,
);

// GET /attendance - Xem lịch sử chấm công của chính mình
meRouter.get(
  "/attendance",
  validate(meAttendanceQuerySchema, "query"),
  meController.listAttendance,
);

// GET /payments - Xem lương của chính mình, tái sử dụng schema validate từ module daily-payment
meRouter.get(
  "/payments",
  validate(listEmployeePaymentsQuerySchema, "query"),
  meController.listPayments,
);

// GET /profile - Xem hồ sơ cá nhân của chính mình
meRouter.get("/profile", meController.getProfile);

// PATCH /profile - Tự cập nhật hồ sơ cá nhân của chính mình, validate body (giới hạn trường được sửa)
meRouter.patch(
  "/profile",
  validate(meUpdateProfileSchema),
  meController.updateProfile,
);

// PUT /avatar - Tự upload/thay avatar của chính mình, multer parse multipart trước khi vào controller
meRouter.put("/avatar", uploadAvatarMiddleware, meController.uploadAvatar);
