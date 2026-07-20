import { prisma } from '../../config/prisma.js';

export function findEmployeeById(employeeId: string) {
  return prisma.employee.findUnique({ where: { id: employeeId } });
}

export function findByEmployeeAndRange(employeeId: string, start: Date, end: Date) {
  return prisma.dailyPayment.findMany({
    where: { employeeId, workDate: { gte: start, lt: end } },
    orderBy: { workDate: 'asc' },
    include: { position: { select: { id: true, name: true } } },
  });
}

export function findAllByRange(start: Date, end: Date, employeeId: string | undefined) {
  return prisma.dailyPayment.findMany({
    where: { workDate: { gte: start, lt: end }, ...(employeeId ? { employeeId } : {}) },
    orderBy: { workDate: 'asc' },
    include: { employee: { select: { id: true, code: true, fullName: true } } },
  });
}
