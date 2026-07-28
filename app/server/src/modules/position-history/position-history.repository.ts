// Module: position-history\r\n// Mô tả: Thao tác cơ sở dữ liệu (Prisma) cho module (chú thích ngắn gọn bằng tiếng Việt)\r\nimport { prisma } from '../../config/prisma.js';

export function findEmployeeById(employeeId: string) {
  return prisma.employee.findUnique({ where: { id: employeeId } });
}

export function findByEmployeeId(employeeId: string) {
  return prisma.positionHistory.findMany({
    where: { employeeId },
    orderBy: { startDate: 'asc' },
    include: { position: { select: { id: true, name: true } } },
  });
}

