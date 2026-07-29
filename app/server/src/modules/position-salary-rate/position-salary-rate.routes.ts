import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../validators/validate.js";
import { createSalaryRateSchema } from "./position-salary-rate.schema.js";
import * as positionSalaryRateController from "./position-salary-rate.controller.js";

export const positionSalaryRateRouter = Router();

// Chỉ yêu cầu đăng nhập ở mức router chung, KHÔNG giới hạn role ở đây
// -> từng route bên dưới sẽ tự quyết định role cần thiết (khác các router trước đó)
positionSalaryRateRouter.use(authenticate);

// GET /:id/salary-rates - Lấy danh sách lịch sử mức lương của 1 vị trí theo id, không giới hạn role
// (OWNER, MANAGER, STAFF đều xem được, miễn đã đăng nhập)
positionSalaryRateRouter.get(
  "/:id/salary-rates",
  positionSalaryRateController.list,
);

// POST /:id/salary-rates - Tạo mức lương mới cho vị trí theo id
// Chỉ OWNER mới có quyền tạo (thêm authorize riêng ngay tại route này) + validate body
positionSalaryRateRouter.post(
  "/:id/salary-rates",
  authorize("OWNER"),
  validate(createSalaryRateSchema),
  positionSalaryRateController.create,
);
