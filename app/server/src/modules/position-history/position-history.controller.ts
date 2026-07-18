import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpStatus } from '../../constants/httpStatus.js';
import * as positionHistoryService from './position-history.service.js';

export const getTimeline = asyncHandler(async (req: Request, res: Response) => {
  const timeline = await positionHistoryService.getTimeline(req.params.id as string);
  res.status(HttpStatus.OK).json(timeline);
});
