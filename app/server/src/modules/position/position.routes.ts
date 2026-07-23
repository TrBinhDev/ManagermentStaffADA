import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../validators/validate.js';
import { listPositionQuerySchema, createPositionSchema, updatePositionSchema } from './position.schema.js';
import * as positionController from './position.controller.js';

export const positionRouter = Router();

positionRouter.use(authenticate, authorize('OWNER', 'MANAGER'));

positionRouter.get('/', validate(listPositionQuerySchema, 'query'), positionController.list);
positionRouter.get('/:id', positionController.getById);
positionRouter.post('/', validate(createPositionSchema), positionController.create);
positionRouter.patch('/:id', validate(updatePositionSchema), positionController.update);
positionRouter.delete('/:id', positionController.remove);
