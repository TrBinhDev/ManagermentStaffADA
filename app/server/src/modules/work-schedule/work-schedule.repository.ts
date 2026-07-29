import { prisma } from "../../config/prisma.js";

// Cấu hình include chung: lấy kèm thông tin ca làm việc
const shiftSelect = {
  shift: { select: { id: true, name: true, startTime: true, endTime: true } },
} as const;
// Cấu hình include chung: lấy kèm thông tin nhân viên
const employeeSelect = {
  employee: { select: { id: true, code: true, fullName: true } },
} as const;

// Tìm nhân viên theo Id
export function findEmployeeById(employeeId: string) {
  return prisma.employee.findUnique({ where: { id: employeeId } });
}

// Tìm ca làm việc theo Id
export function findShiftById(shiftId: string) {
  return prisma.shift.findUnique({ where: { id: shiftId } });
}

// Tìm bản ghi lịch làm việc theo Id (dùng để kiểm tra tồn tại + thuộc đúng nhân viên trước khi sửa/xóa)
export function findScheduleById(id: string) {
  return prisma.workSchedule.findUnique({ where: { id } });
}

// Tìm lịch làm việc của 1 nhân viên trong khoảng thời gian [start, end), kèm thông tin ca
export function findByEmployeeAndRange(
  employeeId: string,
  start: Date,
  end: Date,
) {
  return prisma.workSchedule.findMany({
    where: { employeeId, workDate: { gte: start, lt: end } },
    orderBy: { workDate: "asc" },
    include: shiftSelect,
  });
}

// Tìm lịch làm việc của tất cả nhân viên trong khoảng thời gian, có thể lọc theo ca, kèm thông tin nhân viên + ca
export function findAllByRange(
  start: Date,
  end: Date,
  shiftId: string | undefined,
) {
  return prisma.workSchedule.findMany({
    where: {
      workDate: { gte: start, lt: end },
      ...(shiftId ? { shiftId } : {}),
    },
    orderBy: { workDate: "asc" },
    include: { ...employeeSelect, ...shiftSelect },
  });
}

// Tìm giới hạn số người cho cặp (ca, vị trí) — trả về null nếu chưa cấu hình (nghĩa là không giới hạn)
export function findCapacity(shiftId: string, positionId: string) {
  return prisma.shiftPositionCapacity.findUnique({
    where: { shiftId_positionId: { shiftId, positionId } },
  });
}

// Đếm số nhân viên CÙNG vị trí đang được xếp vào đúng ca + đúng ngày này
// excludeScheduleId: loại trừ 1 bản ghi ra khỏi số đếm (dùng khi update, tránh tự đếm chính bản ghi đang sửa)
export function countSamePositionInShift(
  shiftId: string,
  workDate: Date,
  positionId: string,
  excludeScheduleId?: string,
) {
  return prisma.workSchedule.count({
    where: {
      shiftId,
      workDate,
      employee: { positionId }, // Lọc qua quan hệ: chỉ đếm nhân viên có cùng vị trí công việc
      ...(excludeScheduleId ? { id: { not: excludeScheduleId } } : {}),
    },
  });
}

// Tìm bản ghi lịch làm việc theo đúng bộ 3 (nhân viên, ca, ngày) — dùng where unique tổng hợp,
// khớp @@unique([employeeId, shiftId, workDate]) ở Prisma schema, dùng để kiểm tra đã xếp lịch trùng chưa
export function findExisting(
  employeeId: string,
  shiftId: string,
  workDate: Date,
) {
  return prisma.workSchedule.findUnique({
    where: { employeeId_shiftId_workDate: { employeeId, shiftId, workDate } },
  });
}

// Tạo mới 1 bản ghi lịch làm việc
export function create(employeeId: string, shiftId: string, workDate: Date) {
  return prisma.workSchedule.create({
    data: { employeeId, shiftId, workDate },
  });
}

// Đổi ca cho 1 bản ghi lịch làm việc đã có
export function updateShift(id: string, shiftId: string) {
  return prisma.workSchedule.update({
    where: { id },
    data: { shiftId },
    include: shiftSelect,
  });
}

// Xóa (gỡ) 1 bản ghi lịch làm việc
export function remove(id: string) {
  return prisma.workSchedule.delete({ where: { id } });
}
