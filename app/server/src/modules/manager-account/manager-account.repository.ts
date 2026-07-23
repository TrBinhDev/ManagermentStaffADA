import type { ManagerRole } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

const accountSelect = {
  id: true,
  email: true,
  role: true,
  isActive: true,
  employeeId: true,
  createdAt: true,
  updatedAt: true,
  employee: { select: { fullName: true } },
} as const;

function buildWhere(isActive: boolean | undefined, role: ManagerRole | undefined) {
  return {
    ...(isActive !== undefined ? { isActive } : {}),
    ...(role ? { role } : {}),
  };
}

export function findMany(isActive: boolean | undefined, role: ManagerRole | undefined, skip: number, take: number) {
  return prisma.managerAccount.findMany({
    where: buildWhere(isActive, role),
    skip,
    take,
    orderBy: { createdAt: 'asc' },
    select: accountSelect,
  });
}

export function count(isActive: boolean | undefined, role: ManagerRole | undefined) {
  return prisma.managerAccount.count({ where: buildWhere(isActive, role) });
}

export function findById(id: string) {
  return prisma.managerAccount.findUnique({ where: { id }, select: accountSelect });
}

export function findByEmail(email: string) {
  return prisma.managerAccount.findUnique({ where: { email } });
}

export function findByEmployeeId(employeeId: string) {
  return prisma.managerAccount.findUnique({ where: { employeeId } });
}

export function findEmployeeById(employeeId: string) {
  return prisma.employee.findUnique({ where: { id: employeeId } });
}

export function create(data: { email: string; passwordHash: string; role: ManagerRole; employeeId?: string }) {
  return prisma.managerAccount.create({
    data: { email: data.email, passwordHash: data.passwordHash, role: data.role, employeeId: data.employeeId },
    select: accountSelect,
  });
}

export function update(
  id: string,
  data: { isActive?: boolean; email?: string; role?: ManagerRole; employeeId?: string | null },
) {
  return prisma.managerAccount.update({ where: { id }, data, select: accountSelect });
}

export function updatePasswordHash(id: string, passwordHash: string) {
  return prisma.managerAccount.update({ where: { id }, data: { passwordHash } });
}

export function remove(id: string) {
  return prisma.managerAccount.delete({ where: { id } });
}
