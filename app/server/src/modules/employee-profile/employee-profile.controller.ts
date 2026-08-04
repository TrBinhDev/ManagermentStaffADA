import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { HttpStatus } from "../../constants/httpStatus.js";
import { BadRequestError } from "../../errors/AppError.js";
import * as employeeProfileService from "./employee-profile.service.js";
import type { UpsertEmployeeProfileInput } from "./employee-profile.schema.js";

// Controller lấy hồ sơ chi tiết của 1 nhân viên theo Id
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await employeeProfileService.getProfile(
    req.params.id as string,
  );
  res.status(HttpStatus.OK).json(profile);
});

// Controller tạo mới hoặc cập nhật hồ sơ chi tiết nhân viên (upsert) theo Id
export const upsertProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as UpsertEmployeeProfileInput;
    const profile = await employeeProfileService.upsertProfile(
      req.params.id as string,
      body,
    );
    res.status(HttpStatus.OK).json(profile);
  },
);

// Controller upload/thay avatar cho nhân viên - file được multer parse sẵn vào req.file (memory buffer)
export const uploadAvatar = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new BadRequestError("Thiếu file avatar", "AVATAR_FILE_REQUIRED");
    }
    const profile = await employeeProfileService.uploadAvatar(
      req.params.id as string,
      req.file,
    );
    res.status(HttpStatus.OK).json(profile);
  },
);
