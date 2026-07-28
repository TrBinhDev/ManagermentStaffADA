// Module: employment-period\r\n// Mô tả: Định nghĩa các đường dẫn (endpoints) và middleware liên quan (chú thích ngắn gọn bằng tiếng Việt)\r\nimport { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import * as employmentPeriodController from './employment-period.controller.js';

export const employmentPeriodRouter = Router();

employmentPeriodRouter.use(authenticate, authorize('OWNER', 'MANAGER'));

employmentPeriodRouter.get('/:id/employment-periods', employmentPeriodController.getTimeline);

