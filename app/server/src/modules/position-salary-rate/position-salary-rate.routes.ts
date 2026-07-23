import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../validators/validate.js';
import { createSalaryRateSchema } from './position-salary-rate.schema.js';
import * as positionSalaryRateController from './position-salary-rate.controller.js';

export const positionSalaryRateRouter = Router();

positionSalaryRateRouter.use(authenticate);

positionSalaryRateRouter.get('/:id/salary-rates', positionSalaryRateController.list);
positionSalaryRateRouter.post(
  '/:id/salary-rates',
  authorize('OWNER'),
  validate(createSalaryRateSchema),
  positionSalaryRateController.create,
);
