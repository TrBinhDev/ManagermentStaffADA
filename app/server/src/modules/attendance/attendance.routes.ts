import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { validate } from '../../validators/validate.js';
import { checkInSchema, listAttendanceQuerySchema } from './attendance.schema.js';
import * as attendanceController from './attendance.controller.js';

export const attendanceRouter = Router();

attendanceRouter.use(authenticate);

attendanceRouter.get('/', validate(listAttendanceQuerySchema, 'query'), attendanceController.list);
attendanceRouter.post('/check-in', validate(checkInSchema), attendanceController.checkIn);
attendanceRouter.patch('/:id/check-out', attendanceController.checkOut);
