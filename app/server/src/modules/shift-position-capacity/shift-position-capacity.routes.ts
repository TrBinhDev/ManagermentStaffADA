import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { validate } from '../../validators/validate.js';
import { createCapacitySchema, updateCapacitySchema } from './shift-position-capacity.schema.js';
import * as capacityController from './shift-position-capacity.controller.js';

export const shiftPositionCapacityRouter = Router();

shiftPositionCapacityRouter.use(authenticate);

shiftPositionCapacityRouter.get('/:id/capacities', capacityController.list);
shiftPositionCapacityRouter.post('/:id/capacities', validate(createCapacitySchema), capacityController.create);
shiftPositionCapacityRouter.patch(
  '/:id/capacities/:capacityId',
  validate(updateCapacitySchema),
  capacityController.update,
);
shiftPositionCapacityRouter.delete('/:id/capacities/:capacityId', capacityController.remove);
