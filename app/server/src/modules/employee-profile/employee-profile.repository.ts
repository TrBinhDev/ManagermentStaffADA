import { prisma } from "../../config/prisma.js";
import type { UpsertEmployeeProfileInput } from "./employee-profile.schema.js";

// Kiểu dữ liệu các trường của hồ sơ, loại bỏ cccd (vì cccd cần xử lý riêng: hash + mã hóa)
type ProfileFields = Omit<UpsertEmployeeProfileInput, "cccd">;

// Tìm nhân viên theo Id
export function findEmployeeById(employeeId: string) {
  return prisma.employee.findUnique({ where: { id: employeeId } });
}

// Tìm nhân viên theo mã băm CCCD (dùng để kiểm tra trùng CCCD khi đổi CCCD trong hồ sơ)
export function findEmployeeByCccdHash(cccdHash: string) {
  return prisma.employee.findUnique({ where: { cccdHash } });
}

// Cập nhật lại cccdHash bên bảng Employee (đồng bộ khi CCCD được đổi qua hồ sơ)
export function updateEmployeeCccdHash(employeeId: string, cccdHash: string) {
  return prisma.employee.update({
    where: { id: employeeId },
    data: { cccdHash },
  });
}

// Tìm hồ sơ chi tiết theo Id nhân viên
export function findByEmployeeId(employeeId: string) {
  return prisma.employeeProfile.findUnique({ where: { employeeId } });
}

// Tạo mới hồ sơ chi tiết cho nhân viên (bắt buộc có cccdEncrypted ngay từ đầu)
export function create(
  employeeId: string,
  cccdEncrypted: string,
  data: ProfileFields,
) {
  return prisma.employeeProfile.create({
    data: { employeeId, cccdEncrypted, ...data },
  });
}

// Cập nhật hồ sơ chi tiết đã có, cccdEncrypted là tùy chọn (chỉ cập nhật khi có đổi CCCD)
export function update(
  employeeId: string,
  data: ProfileFields & { cccdEncrypted?: string },
) {
  return prisma.employeeProfile.update({ where: { employeeId }, data });
}

// Cập nhật riêng avatarUrl (dùng cho API upload avatar, tách khỏi upsertProfile chung)
export function updateAvatarUrl(employeeId: string, avatarUrl: string) {
  return prisma.employeeProfile.update({
    where: { employeeId },
    data: { avatarUrl },
  });
}
