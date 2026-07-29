import { prisma } from "../../config/prisma.js";

// Tìm vị trí công việc theo Id
export function findPositionById(positionId: string) {
  return prisma.position.findUnique({ where: { id: positionId } });
}

// Tìm toàn bộ lịch sử mức lương của 1 vị trí, sắp xếp mới nhất trước
export function findByPositionId(positionId: string) {
  return prisma.positionSalaryRate.findMany({
    where: { positionId },
    orderBy: { effectiveFrom: "desc" },
  });
}

// Tìm mức lương đang áp dụng (đang mở, chưa có ngày hết hiệu lực) của 1 vị trí
export function findOpenRate(positionId: string) {
  return prisma.positionSalaryRate.findFirst({
    where: { positionId, effectiveTo: null },
  });
}

// Tạo mức lương mới, đồng thời đóng mức lương cũ đang mở (nếu có) — thực hiện trong 1 transaction để đảm bảo atomic
export function createRate(
  positionId: string,
  hourlyRate: number,
  openRateId: string | undefined,
  effectiveDate: Date,
) {
  return prisma.$transaction(async (tx) => {
    if (openRateId) {
      // Đóng mức lương cũ: gắn effectiveTo = ngày hiệu lực của mức mới
      await tx.positionSalaryRate.update({
        where: { id: openRateId },
        data: { effectiveTo: effectiveDate },
      });
    }

    // Tạo mức lương mới, effectiveTo mặc định là null (đang áp dụng)
    return tx.positionSalaryRate.create({
      data: { positionId, hourlyRate, effectiveFrom: effectiveDate },
    });
  });
}
