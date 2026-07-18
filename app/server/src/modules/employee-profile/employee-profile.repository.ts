import { prisma } from '../../config/prisma.js';
import type { UpsertEmployeeProfileInput } from './employee-profile.schema.js';

type ProfileFields = Omit<UpsertEmployeeProfileInput, 'cccd'>;

export function findEmployeeById(employeeId: string) {
  return prisma.employee.findUnique({ where: { id: employeeId } });
}

export function findEmployeeByCccdHash(cccdHash: string) {
  return prisma.employee.findUnique({ where: { cccdHash } });
}

export function updateEmployeeCccdHash(employeeId: string, cccdHash: string) {
  return prisma.employee.update({ where: { id: employeeId }, data: { cccdHash } });
}

export function findByEmployeeId(employeeId: string) {
  return prisma.employeeProfile.findUnique({ where: { employeeId } });
}

export function create(employeeId: string, cccdEncrypted: string, data: ProfileFields) {
  return prisma.employeeProfile.create({ data: { employeeId, cccdEncrypted, ...data } });
}

export function update(employeeId: string, data: ProfileFields & { cccdEncrypted?: string }) {
  return prisma.employeeProfile.update({ where: { employeeId }, data });
}
