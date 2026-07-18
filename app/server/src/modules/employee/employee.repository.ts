import type { EmployeeStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

const positionSelect = {
  position: { select: { id: true, name: true, department: { select: { name: true } } } },
} as const;

function buildWhere(params: {
  status?: EmployeeStatus;
  positionId?: string;
  departmentId?: string;
  search?: string;
}): Prisma.EmployeeWhereInput {
  const { status, positionId, departmentId, search } = params;

  return {
    ...(status ? { status } : {}),
    ...(positionId ? { positionId } : {}),
    ...(departmentId ? { position: { departmentId } } : {}),
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' as const } },
            { fullName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };
}

export function findMany(
  filters: { status?: EmployeeStatus; positionId?: string; departmentId?: string; search?: string },
  skip: number,
  take: number,
) {
  return prisma.employee.findMany({
    where: buildWhere(filters),
    skip,
    take,
    orderBy: { code: 'asc' },
    select: { id: true, code: true, fullName: true, positionId: true, status: true },
  });
}

export function count(filters: {
  status?: EmployeeStatus;
  positionId?: string;
  departmentId?: string;
  search?: string;
}) {
  return prisma.employee.count({ where: buildWhere(filters) });
}

export function findById(id: string) {
  return prisma.employee.findUnique({ where: { id }, include: positionSelect });
}

export function findByCccdHash(cccdHash: string) {
  return prisma.employee.findUnique({ where: { cccdHash } });
}

export function findPositionById(positionId: string) {
  return prisma.position.findUnique({ where: { id: positionId } });
}

export async function nextCode(): Promise<string> {
  const rows = await prisma.$queryRaw<{ nextval: bigint | number | string }[]>`
    SELECT nextval('employee_code_seq') as nextval
  `;
  const seq = Number(rows[0].nextval);
  return `NV${String(seq).padStart(4, '0')}`;
}

export function create(data: { code: string; cccdHash: string; fullName: string; dob?: Date; positionId: string }) {
  return prisma.employee.create({ data });
}

export function upsertProfileCccd(employeeId: string, cccdEncrypted: string) {
  return prisma.employeeProfile.upsert({
    where: { employeeId },
    create: { employeeId, cccdEncrypted },
    update: { cccdEncrypted },
  });
}

export function update(id: string, data: { fullName?: string; dob?: Date; positionId?: string }) {
  return prisma.employee.update({ where: { id }, data, include: positionSelect });
}

export function updateStatus(id: string, status: EmployeeStatus, positionId?: string) {
  return prisma.employee.update({
    where: { id },
    data: { status, ...(positionId ? { positionId } : {}) },
    include: positionSelect,
  });
}

export function remove(id: string) {
  return prisma.employee.delete({ where: { id } });
}

export function createPositionHistory(employeeId: string, positionId: string) {
  return prisma.positionHistory.create({ data: { employeeId, positionId } });
}

export function closeOpenPositionHistory(employeeId: string) {
  return prisma.positionHistory.updateMany({
    where: { employeeId, endDate: null },
    data: { endDate: new Date() },
  });
}

export function createEmploymentPeriod(employeeId: string) {
  return prisma.employmentPeriod.create({ data: { employeeId } });
}

export function closeOpenEmploymentPeriod(employeeId: string) {
  return prisma.employmentPeriod.updateMany({
    where: { employeeId, endDate: null },
    data: { endDate: new Date() },
  });
}
