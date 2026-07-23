import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../validators/validate.js';
import { listEmployeePaymentsQuerySchema, listAllPaymentsQuerySchema } from './daily-payment.schema.js';
import * as dailyPaymentController from './daily-payment.controller.js';

export const dailyPaymentRouter = Router();

dailyPaymentRouter.use(authenticate, authorize('OWNER', 'MANAGER'));

dailyPaymentRouter.get(
  '/:id/payments',
  validate(listEmployeePaymentsQuerySchema, 'query'),
  dailyPaymentController.listByEmployee,
);

// Tab tong hop toan nha hang, khong thuoc rieng 1 nhan vien - mount o path rieng /payments.
export const dailyPaymentSummaryRouter = Router();

dailyPaymentSummaryRouter.use(authenticate, authorize('OWNER', 'MANAGER'));

dailyPaymentSummaryRouter.get('/', validate(listAllPaymentsQuerySchema, 'query'), dailyPaymentController.listAll);
