import { prisma } from '../../config/prisma.js';

function buildWhere(isActive: boolean | undefined) {
  return isActive !== undefined ? { isActive } : {};
}

export function findMany(isActive: boolean | undefined, skip: number, take: number) {
  return prisma.shift.findMany({ where: buildWhere(isActive), skip, take, orderBy: { name: 'asc' } });
}

export function count(isActive: boolean | undefined) {
  return prisma.shift.count({ where: buildWhere(isActive) });
}

export function findById(id: string) {
  return prisma.shift.findUnique({ where: { id } });
}

export function findByName(name: string) {
  return prisma.shift.findUnique({ where: { name } });
}

export function create(data: { name: string; startTime: string; endTime: string }) {
  return prisma.shift.create({ data });
}

export function update(
  id: string,
  data: { name?: string; startTime?: string; endTime?: string; isActive?: boolean },
) {
  return prisma.shift.update({ where: { id }, data });
}

export function countWorkSchedule(shiftId: string) {
  return prisma.workSchedule.count({ where: { shiftId } });
}

export function remove(id: string) {
  return prisma.shift.delete({ where: { id } });
}
