import { prisma } from '../../config/prisma.js';

export function findEmployeeById(employeeId: string) {
  return prisma.employee.findUnique({ where: { id: employeeId } });
}

export function findByEmployeeId(employeeId: string) {
  return prisma.employmentPeriod.findMany({
    where: { employeeId },
    orderBy: { startDate: 'asc' },
  });
}
