import { Message } from "../../constants/message.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../../errors/AppError.js";
import { hashCccd } from "../../utils/hash.util.js";
import { encrypt, decrypt } from "../../utils/crypto.util.js";
import * as employeeProfileRepository from "./employee-profile.repository.js";
import type { UpsertEmployeeProfileInput } from "./employee-profile.schema.js";

// Hàm chuyển đổi dữ liệu profile trong DB (CCCD đã mã hóa) thành dữ liệu trả về cho client (CCCD đã giải mã)
function toResponse(profile: {
  cccdEncrypted: string;
  [key: string]: unknown;
}) {
  const { cccdEncrypted, ...rest } = profile; // Tách riêng cccdEncrypted ra khỏi các trường còn lại
  return { ...rest, cccd: decrypt(cccdEncrypted) }; // Giải mã CCCD rồi gộp lại thành trường "cccd" cho client dễ dùng
}

// Hàm lấy hồ sơ chi tiết của 1 nhân viên
export async function getProfile(employeeId: string) {
  const employee = await employeeProfileRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(Message.EMPLOYEE.NOT_FOUND, "EMPLOYEE_NOT_FOUND");
  }

  const profile = await employeeProfileRepository.findByEmployeeId(employeeId);
  if (!profile) {
    return null; // Nhân viên tồn tại nhưng chưa từng tạo hồ sơ -> trả về null (không phải lỗi)
  }

  return toResponse(profile);
}

// Hàm tạo mới hoặc cập nhật hồ sơ chi tiết nhân viên (upsert)
export async function upsertProfile(
  employeeId: string,
  input: UpsertEmployeeProfileInput,
) {
  const employee = await employeeProfileRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(Message.EMPLOYEE.NOT_FOUND, "EMPLOYEE_NOT_FOUND");
  }

  const { cccd, ...rest } = input; // Tách riêng cccd ra vì cần xử lý đặc biệt (hash + mã hóa + đồng bộ)
  let cccdEncrypted: string | undefined;

  if (cccd) {
    const newHash = hashCccd(cccd); // Băm CCCD mới để kiểm tra trùng với nhân viên khác
    const conflicting =
      await employeeProfileRepository.findEmployeeByCccdHash(newHash);

    // Nếu CCCD mới bị trùng với 1 nhân viên KHÁC (không phải chính nhân viên đang sửa)
    if (conflicting && conflicting.id !== employeeId) {
      if (conflicting.status === "ACTIVE") {
        throw new ConflictError(
          Message.EMPLOYEE.CCCD_ACTIVE_EXISTS,
          "CCCD_ACTIVE_EXISTS",
        );
      }
      throw new ConflictError(
        Message.EMPLOYEE.CCCD_RESIGNED_EXISTS,
        "CCCD_RESIGNED_EXISTS",
        {
          employeeId: conflicting.id,
        },
      );
    }

    cccdEncrypted = encrypt(cccd); // Mã hóa CCCD (2 chiều) để lưu vào hồ sơ
    await employeeProfileRepository.updateEmployeeCccdHash(employeeId, newHash); // Đồng bộ lại cccdHash bên bảng Employee
  }

  const existingProfile =
    await employeeProfileRepository.findByEmployeeId(employeeId);

  if (!existingProfile) {
    // Chưa có hồ sơ -> tạo mới, bắt buộc phải có CCCD ngay từ lần tạo đầu tiên
    if (!cccdEncrypted) {
      throw new BadRequestError(
        Message.EMPLOYEE_PROFILE.CCCD_REQUIRED,
        "CCCD_REQUIRED",
      );
    }
    await employeeProfileRepository.create(employeeId, cccdEncrypted, rest);
  } else {
    // Đã có hồ sơ -> cập nhật, chỉ cập nhật cccdEncrypted nếu lần này có đổi CCCD
    await employeeProfileRepository.update(employeeId, {
      ...rest,
      ...(cccdEncrypted ? { cccdEncrypted } : {}),
    });
  }

  return getProfile(employeeId); // Trả về hồ sơ mới nhất sau khi tạo/cập nhật (đã giải mã CCCD)
}
