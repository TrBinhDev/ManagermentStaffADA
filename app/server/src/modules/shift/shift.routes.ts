// Module: shift\r\n// Mô tả: Định nghĩa các đường dẫn (endpoints) và middleware liên quan (chú thích ngắn gọn bằng tiếng Việt)\r\nimport { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../validators/validate.js';
import { listShiftQuerySchema, createShiftSchema, updateShiftSchema } from './shift.schema.js';
import * as shiftController from './shift.controller.js';

export const shiftRouter = Router();

shiftRouter.use(authenticate, authorize('OWNER', 'MANAGER'));

shiftRouter.get('/', validate(listShiftQuerySchema, 'query'), shiftController.list);
shiftRouter.get('/:id', shiftController.getById);
shiftRouter.post('/', validate(createShiftSchema), shiftController.create);
shiftRouter.patch('/:id', validate(updateShiftSchema), shiftController.update);
shiftRouter.delete('/:id', shiftController.remove);

