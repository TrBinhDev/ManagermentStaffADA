import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../validators/validate.js';
import { createSalaryRateSchema } from './position-salary-rate.schema.js';
import * as positionSalaryRateController from './position-salary-rate.controller.js';

export const positionSalaryRateRouter = Router();

positionSalaryRateRouter.use(authenticate);

positionSalaryRateRouter.get('/:id/salary-rates', positionSalaryRateController.list);
// Tao muc luong moi gioi han OWNER-only — quyet dinh tai chinh cap cao, khac cac API
// van hanh hang ngay (chấm cong, xep lich) ma MANAGER can lam. Xem docs/V4.md muc 1.
positionSalaryRateRouter.post(
  '/:id/salary-rates',
  authorize('OWNER'),
  validate(createSalaryRateSchema),
  positionSalaryRateController.create,
);
