import { prisma } from '../../config/prisma.js';

const shiftSelect = { shift: { select: { id: true, name: true, startTime: true, endTime: true } } } as const;
const employeeSelect = { employee: { select: { id: true, code: true, fullName: true } } } as const;

export function findEmployeeById(employeeId: string) {
  return prisma.employee.findUnique({ where: { id: employeeId } });
}

export function findShiftById(shiftId: string) {
  return prisma.shift.findUnique({ where: { id: shiftId } });
}

export function findScheduleById(id: string) {
  return prisma.workSchedule.findUnique({ where: { id } });
}

export function findByEmployeeAndRange(employeeId: string, start: Date, end: Date) {
  return prisma.workSchedule.findMany({
    where: { employeeId, workDate: { gte: start, lt: end } },
    orderBy: { workDate: 'asc' },
    include: shiftSelect,
  });
}

export function findAllByRange(start: Date, end: Date, shiftId: string | undefined) {
  return prisma.workSchedule.findMany({
    where: { workDate: { gte: start, lt: end }, ...(shiftId ? { shiftId } : {}) },
    orderBy: { workDate: 'asc' },
    include: { ...employeeSelect, ...shiftSelect },
  });
}

export function findCapacity(shiftId: string, positionId: string) {
  return prisma.shiftPositionCapacity.findUnique({
    where: { shiftId_positionId: { shiftId, positionId } },
  });
}

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
      employee: { positionId },
      ...(excludeScheduleId ? { id: { not: excludeScheduleId } } : {}),
    },
  });
}

export function findExisting(employeeId: string, shiftId: string, workDate: Date) {
  return prisma.workSchedule.findUnique({
    where: { employeeId_shiftId_workDate: { employeeId, shiftId, workDate } },
  });
}

export function create(employeeId: string, shiftId: string, workDate: Date) {
  return prisma.workSchedule.create({ data: { employeeId, shiftId, workDate } });
}

export function updateShift(id: string, shiftId: string) {
  return prisma.workSchedule.update({ where: { id }, data: { shiftId }, include: shiftSelect });
}

export function remove(id: string) {
  return prisma.workSchedule.delete({ where: { id } });
}
