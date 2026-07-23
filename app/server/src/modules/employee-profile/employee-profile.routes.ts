import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../validators/validate.js';
import { upsertEmployeeProfileSchema } from './employee-profile.schema.js';
import * as employeeProfileController from './employee-profile.controller.js';

export const employeeProfileRouter = Router();

employeeProfileRouter.use(authenticate, authorize('OWNER', 'MANAGER'));

employeeProfileRouter.get('/:id/profile', employeeProfileController.getProfile);
employeeProfileRouter.put(
  '/:id/profile',
  validate(upsertEmployeeProfileSchema),
  employeeProfileController.upsertProfile,
);
