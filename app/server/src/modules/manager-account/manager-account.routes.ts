import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../validators/validate.js';
import {
  listManagerAccountQuerySchema,
  createManagerAccountSchema,
  updateManagerAccountSchema,
  resetPasswordSchema,
} from './manager-account.schema.js';
import * as managerAccountController from './manager-account.controller.js';

export const managerAccountRouter = Router();

managerAccountRouter.use(authenticate, authorize('OWNER'));

managerAccountRouter.get('/', validate(listManagerAccountQuerySchema, 'query'), managerAccountController.list);
managerAccountRouter.get('/:id', managerAccountController.getById);
managerAccountRouter.post('/', validate(createManagerAccountSchema), managerAccountController.create);
managerAccountRouter.patch('/:id', validate(updateManagerAccountSchema), managerAccountController.update);
managerAccountRouter.patch(
  '/:id/reset-password',
  validate(resetPasswordSchema),
  managerAccountController.resetPassword,
);
managerAccountRouter.delete('/:id', managerAccountController.remove);
