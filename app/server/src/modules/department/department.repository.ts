import { prisma } from '../../config/prisma.js';

function buildWhere(search?: string) {
  return search ? { name: { contains: search, mode: 'insensitive' as const } } : {};
}

export function findMany(search: string | undefined, skip: number, take: number) {
  return prisma.department.findMany({ where: buildWhere(search), skip, take, orderBy: { name: 'asc' } });
}

export function count(search: string | undefined) {
  return prisma.department.count({ where: buildWhere(search) });
}

export function findById(id: string) {
  return prisma.department.findUnique({ where: { id } });
}

export function findByName(name: string) {
  return prisma.department.findUnique({ where: { name } });
}

export function create(name: string) {
  return prisma.department.create({ data: { name } });
}

export function update(id: string, data: { name?: string }) {
  return prisma.department.update({ where: { id }, data });
}

export function countPositions(departmentId: string) {
  return prisma.position.count({ where: { departmentId } });
}

export function remove(id: string) {
  return prisma.department.delete({ where: { id } });
}
