import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

const summarySelect = {
  employee: { select: { id: true, code: true, fullName: true } },
  shift: { select: { id: true, name: true, startTime: true, endTime: true } },
} as const;

export function findEmployeeById(employeeId: string) {
  return prisma.employee.findUnique({ where: { id: employeeId } });
}

export function findShiftById(shiftId: string) {
  return prisma.shift.findUnique({ where: { id: shiftId } });
}

export function findWorkSchedule(employeeId: string, shiftId: string, workDate: Date) {
  return prisma.workSchedule.findUnique({
    where: { employeeId_shiftId_workDate: { employeeId, shiftId, workDate } },
  });
}

export function findExistingAttendance(employeeId: string, shiftId: string, workDate: Date) {
  return prisma.attendance.findUnique({
    where: { employeeId_workDate_shiftId: { employeeId, workDate, shiftId } },
  });
}

export function createCheckIn(employeeId: string, shiftId: string, workDate: Date, checkedInById: string) {
  return prisma.attendance.create({
    data: { employeeId, shiftId, workDate, checkedInAt: new Date(), checkedInById },
    include: summarySelect,
  });
}

export function findById(id: string) {
  return prisma.attendance.findUnique({ where: { id } });
}

// Vi tri THUC TE nhan vien giu tai thoi diem check-in (khong phai Employee.positionId hien
// tai) - tra qua PositionHistory vi nhan vien co the da doi vi tri sau khi check-in nhung
// truoc luc check-out.
//
// Dung dung `checkedInAt` (moc thoi gian chinh xac) thay vi `workDate` (chi co do phan giai
// theo ngay) - vi PositionHistory.startDate/endDate la DateTime co gio, nhan vien co the doi
// vi tri NGAY TRONG NGAY dang lam. Neu chi so theo workDate se khong biet chon dong nao khi
// 2 dong PositionHistory cung "chong lan" trong 1 ngay - dung checkedInAt moi xac dinh dung
// vi tri ho dang lam luc bat dau ca.
export function findPositionHistoryAt(employeeId: string, at: Date) {
  return prisma.positionHistory.findFirst({
    where: {
      employeeId,
      startDate: { lte: at },
      OR: [{ endDate: null }, { endDate: { gt: at } }],
    },
    orderBy: { startDate: 'desc' },
  });
}

export function findSalaryRateAt(positionId: string, workDate: Date) {
  return prisma.positionSalaryRate.findFirst({
    where: {
      positionId,
      effectiveFrom: { lte: workDate },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: workDate } }],
    },
    orderBy: { effectiveFrom: 'desc' },
  });
}

interface PaymentData {
  employeeId: string;
  positionId: string;
  workDate: Date;
  hoursWorked: Prisma.Decimal;
  hourlyRate: Prisma.Decimal;
  amount: Prisma.Decimal;
}

export function checkOutWithPayment(
  attendanceId: string,
  checkedOutById: string,
  checkedOutAt: Date,
  payment: PaymentData,
) {
  return prisma.$transaction(async (tx) => {
    const attendance = await tx.attendance.update({
      where: { id: attendanceId },
      data: { checkedOutAt, checkedOutById },
      include: summarySelect,
    });

    const dailyPayment = await tx.dailyPayment.create({
      data: {
        attendanceId,
        employeeId: payment.employeeId,
        positionId: payment.positionId,
        workDate: payment.workDate,
        hoursWorked: payment.hoursWorked,
        hourlyRate: payment.hourlyRate,
        amount: payment.amount,
      },
    });

    return { attendance, dailyPayment };
  });
}

interface AttendanceFilters {
  employeeId?: string;
  from?: Date;
  to?: Date;
}

function buildWhere({ employeeId, from, to }: AttendanceFilters) {
  return {
    ...(employeeId ? { employeeId } : {}),
    ...(from || to
      ? {
          workDate: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };
}

export function findMany(filters: AttendanceFilters, skip: number, take: number) {
  return prisma.attendance.findMany({
    where: buildWhere(filters),
    skip,
    take,
    orderBy: { workDate: 'desc' },
    include: summarySelect,
  });
}

export function count(filters: AttendanceFilters) {
  return prisma.attendance.count({ where: buildWhere(filters) });
}
