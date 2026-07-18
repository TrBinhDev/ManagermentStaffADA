import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import * as employmentPeriodController from './employment-period.controller.js';

export const employmentPeriodRouter = Router();

employmentPeriodRouter.use(authenticate);

employmentPeriodRouter.get('/:id/employment-periods', employmentPeriodController.getTimeline);
