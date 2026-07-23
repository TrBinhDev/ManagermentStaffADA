import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../validators/validate.js';
import {
  listEmployeeQuerySchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  rehireEmployeeSchema,
} from './employee.schema.js';
import * as employeeController from './employee.controller.js';

export const employeeRouter = Router();

employeeRouter.use(authenticate, authorize('OWNER', 'MANAGER'));

employeeRouter.get('/', validate(listEmployeeQuerySchema, 'query'), employeeController.list);
employeeRouter.get('/:id', employeeController.getById);
employeeRouter.post('/', validate(createEmployeeSchema), employeeController.create);
employeeRouter.patch('/:id', validate(updateEmployeeSchema), employeeController.update);
employeeRouter.delete('/:id', employeeController.remove);
employeeRouter.patch('/:id/resign', employeeController.resign);
employeeRouter.patch('/:id/rehire', validate(rehireEmployeeSchema), employeeController.rehire);
