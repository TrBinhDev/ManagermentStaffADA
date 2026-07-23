import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../validators/validate.js';
import {
  listEmployeeWorkScheduleQuerySchema,
  listAllWorkScheduleQuerySchema,
  bulkCreateWorkScheduleSchema,
  updateWorkScheduleSchema,
} from './work-schedule.schema.js';
import * as workScheduleController from './work-schedule.controller.js';

export const workScheduleRouter = Router();

workScheduleRouter.use(authenticate, authorize('OWNER', 'MANAGER'));

workScheduleRouter.get(
  '/:id/work-schedule',
  validate(listEmployeeWorkScheduleQuerySchema, 'query'),
  workScheduleController.listByEmployee,
);
workScheduleRouter.post(
  '/:id/work-schedule/bulk',
  validate(bulkCreateWorkScheduleSchema),
  workScheduleController.bulkCreate,
);
workScheduleRouter.patch(
  '/:id/work-schedule/:scheduleId',
  validate(updateWorkScheduleSchema),
  workScheduleController.updateShift,
);
workScheduleRouter.delete('/:id/work-schedule/:scheduleId', workScheduleController.remove);

// Tab tong hop toan nha hang, khong thuoc rieng 1 nhan vien - mount o path rieng /work-schedule.
export const workScheduleSummaryRouter = Router();

workScheduleSummaryRouter.use(authenticate, authorize('OWNER', 'MANAGER'));

workScheduleSummaryRouter.get(
  '/',
  validate(listAllWorkScheduleQuerySchema, 'query'),
  workScheduleController.listAll,
);
