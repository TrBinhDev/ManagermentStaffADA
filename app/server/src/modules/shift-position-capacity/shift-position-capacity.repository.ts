import { prisma } from "../../config/prisma.js";

// Cấu hình include chung: lấy kèm vị trí công việc + tên phòng ban
const positionSelect = {
  position: {
    select: { id: true, name: true, department: { select: { name: true } } },
  },
} as const;

// Tìm ca làm việc theo Id
export function findShiftById(shiftId: string) {
  return prisma.shift.findUnique({ where: { id: shiftId } });
}

// Tìm vị trí công việc theo Id
export function findPositionById(positionId: string) {
  return prisma.position.findUnique({ where: { id: positionId } });
}

// Tìm danh sách giới hạn nhân sự của 1 ca làm việc, sắp xếp theo tên vị trí tăng dần, kèm thông tin vị trí + phòng ban
export function findByShiftId(shiftId: string) {
  return prisma.shiftPositionCapacity.findMany({
    where: { shiftId },
    orderBy: { position: { name: "asc" } },
    include: positionSelect,
  });
}

// Tìm giới hạn theo cặp (ca, vị trí) — dùng where unique tổng hợp, khớp @@unique([shiftId, positionId]) ở Prisma schema
// (dùng để kiểm tra trùng khi tạo mới)
export function findByShiftAndPosition(shiftId: string, positionId: string) {
  return prisma.shiftPositionCapacity.findUnique({
    where: { shiftId_positionId: { shiftId, positionId } },
  });
}

// Tìm bản ghi giới hạn theo Id (dùng để kiểm tra thuộc về ca nào trước khi sửa/xóa)
export function findById(id: string) {
  return prisma.shiftPositionCapacity.findUnique({ where: { id } });
}

// Tạo mới giới hạn nhân sự cho 1 cặp (ca, vị trí)
export function create(shiftId: string, positionId: string, maxStaff: number) {
  return prisma.shiftPositionCapacity.create({
    data: { shiftId, positionId, maxStaff },
    include: positionSelect,
  });
}

// Cập nhật số lượng tối đa của 1 giới hạn đã có
export function update(id: string, maxStaff: number) {
  return prisma.shiftPositionCapacity.update({
    where: { id },
    data: { maxStaff },
    include: positionSelect,
  });
}

// Xóa giới hạn nhân sự
export function remove(id: string) {
  return prisma.shiftPositionCapacity.delete({ where: { id } });
}
