import { prisma } from "../../config/prisma.js";

// Tìm nhân viên theo Id
export function findEmployeeById(employeeId: string) {
  return prisma.employee.findUnique({ where: { id: employeeId } });
}

// Tìm danh sách các giai đoạn gắn bó của 1 nhân viên, sắp xếp theo ngày bắt đầu tăng dần
export function findByEmployeeId(employeeId: string) {
  return prisma.employmentPeriod.findMany({
    where: { employeeId },
    orderBy: { startDate: "asc" },
  });
}
