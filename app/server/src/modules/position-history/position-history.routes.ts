import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import * as positionHistoryController from './position-history.controller.js';

export const positionHistoryRouter = Router();

positionHistoryRouter.use(authenticate, authorize('OWNER', 'MANAGER'));

positionHistoryRouter.get('/:id/position-history', positionHistoryController.getTimeline);
