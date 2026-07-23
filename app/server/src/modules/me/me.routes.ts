import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../validators/validate.js';
import { listEmployeeWorkScheduleQuerySchema } from '../work-schedule/work-schedule.schema.js';
import { listEmployeePaymentsQuerySchema } from '../daily-payment/daily-payment.schema.js';
import { meAttendanceQuerySchema, meUpdateProfileSchema } from './me.schema.js';
import * as meController from './me.controller.js';

export const meRouter = Router();

// Chi STAFF duoc goi cac route nay - OWNER/MANAGER da co route day du rieng (co employeeId
// tren query/param), khong can dung lai /me/* lam gi.
meRouter.use(authenticate, authorize('STAFF'));

meRouter.get(
  '/work-schedule',
  validate(listEmployeeWorkScheduleQuerySchema, 'query'),
  meController.listWorkSchedule,
);
meRouter.get('/attendance', validate(meAttendanceQuerySchema, 'query'), meController.listAttendance);
meRouter.get('/payments', validate(listEmployeePaymentsQuerySchema, 'query'), meController.listPayments);
meRouter.get('/profile', meController.getProfile);
meRouter.patch('/profile', validate(meUpdateProfileSchema), meController.updateProfile);
