import { prisma } from "../../config/prisma.js";

// Tìm nhân viên theo Id
export function findEmployeeById(employeeId: string) {
  return prisma.employee.findUnique({ where: { id: employeeId } });
}

// Tìm danh sách lịch sử vị trí công việc của 1 nhân viên, sắp xếp theo ngày bắt đầu tăng dần, kèm thông tin vị trí
export function findByEmployeeId(employeeId: string) {
  return prisma.positionHistory.findMany({
    where: { employeeId },
    orderBy: { startDate: "asc" },
    include: { position: { select: { id: true, name: true } } }, // Lấy kèm id + tên vị trí, không lấy cả object position đầy đủ
  });
}
