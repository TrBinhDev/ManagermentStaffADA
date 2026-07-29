import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../validators/validate.js';
import {
  listEmployeeQuerySchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  rehireEmployeeSchema,
} from './employee.schema.js';
import * as employeeController from './employee.controller.js';

export const employeeRouter = Router();

// Chỉ cho OWNER và MANAGER truy cập, phải đăng nhập trước
employeeRouter.use(authenticate, authorize('OWNER', 'MANAGER'));

// GET / - Lấy danh sách nhân viên, validate query (lọc/tìm kiếm/phân trang)
employeeRouter.get('/', validate(listEmployeeQuerySchema, 'query'), employeeController.list);

// GET /:id - Lấy chi tiết 1 nhân viên theo id
employeeRouter.get('/:id', employeeController.getById);

// POST / - Tạo mới nhân viên, validate body trước khi vào controller
employeeRouter.post('/', validate(createEmployeeSchema), employeeController.create);

// PATCH /:id - Cập nhật thông tin nhân viên theo id, validate body
employeeRouter.patch('/:id', validate(updateEmployeeSchema), employeeController.update);

// DELETE /:id - Xóa nhân viên theo id
employeeRouter.delete('/:id', employeeController.remove);

// PATCH /:id/resign - Cho nhân viên nghỉ việc, không cần body nên không validate
employeeRouter.patch('/:id/resign', employeeController.resign);

// PATCH /:id/rehire - Thuê lại nhân viên đã nghỉ việc, validate body (vị trí mới nếu có)
employeeRouter.patch('/:id/rehire', validate(rehireEmployeeSchema), employeeController.rehire);