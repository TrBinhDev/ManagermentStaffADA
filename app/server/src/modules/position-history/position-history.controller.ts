import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { HttpStatus } from "../../constants/httpStatus.js";
import * as positionHistoryService from "./position-history.service.js";

// Controller lấy timeline (lịch sử) các vị trí công việc mà 1 nhân viên đã từng giữ theo Id
export const getTimeline = asyncHandler(async (req: Request, res: Response) => {
  const timeline = await positionHistoryService.getTimeline(
    req.params.id as string,
  );
  res.status(HttpStatus.OK).json(timeline);
});
