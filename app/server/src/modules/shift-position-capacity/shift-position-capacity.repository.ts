import { prisma } from '../../config/prisma.js';

const positionSelect = {
  position: { select: { id: true, name: true, department: { select: { name: true } } } },
} as const;

export function findShiftById(shiftId: string) {
  return prisma.shift.findUnique({ where: { id: shiftId } });
}

export function findPositionById(positionId: string) {
  return prisma.position.findUnique({ where: { id: positionId } });
}

export function findByShiftId(shiftId: string) {
  return prisma.shiftPositionCapacity.findMany({
    where: { shiftId },
    orderBy: { position: { name: 'asc' } },
    include: positionSelect,
  });
}

export function findByShiftAndPosition(shiftId: string, positionId: string) {
  return prisma.shiftPositionCapacity.findUnique({
    where: { shiftId_positionId: { shiftId, positionId } },
  });
}

export function findById(id: string) {
  return prisma.shiftPositionCapacity.findUnique({ where: { id } });
}

export function create(shiftId: string, positionId: string, maxStaff: number) {
  return prisma.shiftPositionCapacity.create({
    data: { shiftId, positionId, maxStaff },
    include: positionSelect,
  });
}

export function update(id: string, maxStaff: number) {
  return prisma.shiftPositionCapacity.update({
    where: { id },
    data: { maxStaff },
    include: positionSelect,
  });
}

export function remove(id: string) {
  return prisma.shiftPositionCapacity.delete({ where: { id } });
}
