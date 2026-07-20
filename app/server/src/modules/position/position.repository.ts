import { prisma } from '../../config/prisma.js';

const departmentSelect = { department: { select: { id: true, name: true } } } as const;
const departmentNameSelect = { department: { select: { name: true } } } as const;

function buildWhere(departmentId: string | undefined, search: string | undefined, isActive: boolean | undefined) {
  return {
    ...(departmentId ? { departmentId } : {}),
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  };
}

export function findMany(
  departmentId: string | undefined,
  search: string | undefined,
  isActive: boolean | undefined,
  skip: number,
  take: number,
) {
  return prisma.position.findMany({
    where: buildWhere(departmentId, search, isActive),
    skip,
    take,
    orderBy: { name: 'asc' },
    include: departmentNameSelect,
  });
}

export function count(departmentId: string | undefined, search: string | undefined, isActive: boolean | undefined) {
  return prisma.position.count({ where: buildWhere(departmentId, search, isActive) });
}

export function findById(id: string) {
  return prisma.position.findUnique({ where: { id }, include: departmentSelect });
}

export function findByNameAndDepartment(name: string, departmentId: string) {
  return prisma.position.findUnique({
    where: { name_departmentId: { name, departmentId } },
  });
}

export function findDepartmentById(departmentId: string) {
  return prisma.department.findUnique({ where: { id: departmentId } });
}

export function create(name: string, departmentId: string) {
  return prisma.position.create({ data: { name, departmentId }, include: departmentSelect });
}

export function update(id: string, data: { name?: string; departmentId?: string; isActive?: boolean }) {
  return prisma.position.update({ where: { id }, data, include: departmentSelect });
}

export function countPositionHistory(positionId: string) {
  return prisma.positionHistory.count({ where: { positionId } });
}

export function countSalaryRate(positionId: string) {
  return prisma.positionSalaryRate.count({ where: { positionId } });
}

export function remove(id: string) {
  return prisma.position.delete({ where: { id } });
}
