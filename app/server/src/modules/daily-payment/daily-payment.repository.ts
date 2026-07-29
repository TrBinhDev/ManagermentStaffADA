import { prisma } from "../../config/prisma.js";

// Tìm nhân viên theo Id
export function findEmployeeById(employeeId: string) {
  return prisma.employee.findUnique({ where: { id: employeeId } });
}

// Tìm danh sách lương ngày của 1 nhân viên trong khoảng thời gian [start, end)
export function findByEmployeeAndRange(
  employeeId: string,
  start: Date,
  end: Date,
) {
  return prisma.dailyPayment.findMany({
    where: { employeeId, workDate: { gte: start, lt: end } }, // Từ start (bao gồm) đến end (không bao gồm)
    orderBy: { workDate: "asc" }, // Sắp xếp theo ngày làm việc tăng dần
    include: { position: { select: { id: true, name: true } } }, // Kèm thông tin vị trí công việc
  });
}

// Tìm danh sách lương ngày của tất cả nhân viên (hoặc 1 nhân viên nếu có truyền employeeId) trong khoảng thời gian [start, end)
export function findAllByRange(
  start: Date,
  end: Date,
  employeeId: string | undefined,
) {
  return prisma.dailyPayment.findMany({
    where: {
      workDate: { gte: start, lt: end },
      ...(employeeId ? { employeeId } : {}),
    }, // Lọc thêm theo employeeId nếu có
    orderBy: { workDate: "asc" }, // Sắp xếp theo ngày làm việc tăng dần
    include: { employee: { select: { id: true, code: true, fullName: true } } }, // Kèm thông tin nhân viên
  });
}
