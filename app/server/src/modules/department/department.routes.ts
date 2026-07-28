// Module: department\r\n// Mô tả: Định nghĩa các đường dẫn (endpoints) và middleware liên quan (chú thích ngắn gọn bằng tiếng Việt)\r\nimport { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../validators/validate.js';
import { listDepartmentQuerySchema, createDepartmentSchema, updateDepartmentSchema } from './department.schema.js';
import * as departmentController from './department.controller.js';

export const departmentRouter = Router();

departmentRouter.use(authenticate, authorize('OWNER', 'MANAGER'));

departmentRouter.get('/', validate(listDepartmentQuerySchema, 'query'), departmentController.list);
departmentRouter.get('/:id', departmentController.getById);
departmentRouter.post('/', validate(createDepartmentSchema), departmentController.create);
departmentRouter.patch('/:id', validate(updateDepartmentSchema), departmentController.update);
departmentRouter.delete('/:id', departmentController.remove);

