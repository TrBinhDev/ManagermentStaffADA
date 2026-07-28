// Module: position-salary-rate\r\n// Mô tả: Thao tác cơ sở dữ liệu (Prisma) cho module (chú thích ngắn gọn bằng tiếng Việt)\r\nimport { prisma } from '../../config/prisma.js';

export function findPositionById(positionId: string) {
  return prisma.position.findUnique({ where: { id: positionId } });
}

export function findByPositionId(positionId: string) {
  return prisma.positionSalaryRate.findMany({
    where: { positionId },
    orderBy: { effectiveFrom: 'desc' },
  });
}

export function findOpenRate(positionId: string) {
  return prisma.positionSalaryRate.findFirst({
    where: { positionId, effectiveTo: null },
  });
}

export function createRate(positionId: string, hourlyRate: number, openRateId: string | undefined, effectiveDate: Date) {
  return prisma.$transaction(async (tx) => {
    if (openRateId) {
      await tx.positionSalaryRate.update({
        where: { id: openRateId },
        data: { effectiveTo: effectiveDate },
      });
    }

    return tx.positionSalaryRate.create({
      data: { positionId, hourlyRate, effectiveFrom: effectiveDate },
    });
  });
}

