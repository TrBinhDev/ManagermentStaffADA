import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../validators/validate.js";
import {
  listEmployeePaymentsQuerySchema,
  listAllPaymentsQuerySchema,
  summaryQuerySchema,
} from "./daily-payment.schema.js";
import * as dailyPaymentController from "./daily-payment.controller.js";

// Router lồng theo nhân viên, ví dụ: /employees/:id/payments
export const dailyPaymentRouter = Router();

// Chỉ cho OWNER và MANAGER truy cập, phải đăng nhập trước
dailyPaymentRouter.use(authenticate, authorize("OWNER", "MANAGER"));

// GET /:id/payments - Lấy danh sách lương ngày của 1 nhân viên theo id, validate query (lọc/phân trang)
dailyPaymentRouter.get(
  "/:id/payments",
  validate(listEmployeePaymentsQuerySchema, "query"),
  dailyPaymentController.listByEmployee,
);

// Router riêng dùng để lấy tổng hợp lương của tất cả nhân viên, ví dụ mount ở /payments
export const dailyPaymentSummaryRouter = Router();

// Chỉ cho OWNER và MANAGER truy cập, phải đăng nhập trước
dailyPaymentSummaryRouter.use(authenticate, authorize("OWNER", "MANAGER"));

// GET /summary - Lấy tổng lương toàn nhà hàng trong tháng (1 con số duy nhất, không phân trang)
// Đặt trước "/" cho rõ ràng, dù 2 path này không đụng nhau
dailyPaymentSummaryRouter.get(
  "/summary",
  validate(summaryQuerySchema, "query"),
  dailyPaymentController.getSummary,
);

// GET / - Lấy danh sách lương ngày của tất cả nhân viên, validate query (lọc/phân trang)
dailyPaymentSummaryRouter.get(
  "/",
  validate(listAllPaymentsQuerySchema, "query"),
  dailyPaymentController.listAll,
);
