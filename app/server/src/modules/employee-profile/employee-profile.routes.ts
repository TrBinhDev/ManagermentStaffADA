import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../validators/validate.js';
import { upsertEmployeeProfileSchema } from './employee-profile.schema.js';
import * as employeeProfileController from './employee-profile.controller.js';

export const employeeProfileRouter = Router();

// Chỉ cho OWNER và MANAGER truy cập, phải đăng nhập trước
employeeProfileRouter.use(authenticate, authorize('OWNER', 'MANAGER'));

// GET /:id/profile - Lấy hồ sơ chi tiết của 1 nhân viên theo id
employeeProfileRouter.get('/:id/profile', employeeProfileController.getProfile);

// PUT /:id/profile - Tạo mới hoặc cập nhật hồ sơ chi tiết nhân viên (upsert), validate body
employeeProfileRouter.put(
  '/:id/profile',
  validate(upsertEmployeeProfileSchema),
  employeeProfileController.upsertProfile,
);