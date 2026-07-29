import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../validators/validate.js';
import { checkInSchema, listAttendanceQuerySchema } from './attendance.schema.js';
import * as attendanceController from './attendance.controller.js';

export const attendanceRouter = Router();

// Router tổng của attendance chỉ cho 2 role OWNER với MANAGER qua
// (mọi route bên dưới đều phải đăng nhập + có 1 trong 2 role này mới được truy cập)
attendanceRouter.use(authenticate, authorize('OWNER', 'MANAGER'));

// GET /  - Lấy danh sách chấm công (có validate query: lọc + phân trang)
attendanceRouter.get('/', validate(listAttendanceQuerySchema, 'query'), attendanceController.list);

// POST /check-in - Check-in cho nhân viên (có validate body trước khi vào controller)
attendanceRouter.post('/check-in', validate(checkInSchema), attendanceController.checkIn);

// PATCH /:id/check-out - Check-out cho bản ghi chấm công theo id (không validate body vì không cần dữ liệu đầu vào)
attendanceRouter.patch('/:id/check-out', attendanceController.checkOut);