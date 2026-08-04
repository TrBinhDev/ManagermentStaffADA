import multer from "multer";
import { BadRequestError } from "../errors/AppError.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Dùng memoryStorage (không ghi ra disk) vì file sẽ được upload thẳng lên R2 dưới dạng buffer
export const uploadAvatarMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new BadRequestError("Chỉ chấp nhận ảnh JPEG, PNG hoặc WEBP", "INVALID_FILE_TYPE"));
      return;
    }
    cb(null, true);
  },
}).single("avatar"); // field name trong form-data phải là "avatar"