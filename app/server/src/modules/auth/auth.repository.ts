import { prisma } from '../../config/prisma.js';

export function findByEmail(email: string) {
  return prisma.managerAccount.findUnique({ where: { email } });
}

export function findById(id: string) {
  return prisma.managerAccount.findUnique({ where: { id } });
}

export function findMeById(id: string) {
  return prisma.managerAccount.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, employeeId: true },
  });
}

export function updatePasswordHash(id: string, passwordHash: string) {
  return prisma.managerAccount.update({ where: { id }, data: { passwordHash } });
}
