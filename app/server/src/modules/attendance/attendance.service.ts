import { Prisma } from '@prisma/client';
import { Message } from '../../constants/message.js';
import { BadRequestError, NotFoundError, ConflictError } from '../../errors/AppError.js';
import { parseDateOnly, combineDateAndTime } from '../../utils/date.util.js';
import * as attendanceRepository from './attendance.repository.js';
import type { CheckInInput, ListAttendanceQuery } from './attendance.schema.js';

const MS_PER_HOUR = 60 * 60 * 1000;
const AMOUNT_ROUND_UNIT = 1000;
const EARLY_CHECKIN_GRACE_MS = 5 * 60 * 1000;

export async function checkIn({ employeeId, shiftId, workDate: workDateStr }: CheckInInput, performedById: string) {
  const employee = await attendanceRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(Message.ATTENDANCE.EMPLOYEE_NOT_FOUND, 'EMPLOYEE_NOT_FOUND');
  }
  if (employee.status !== 'ACTIVE') {
    throw new BadRequestError(Message.ATTENDANCE.EMPLOYEE_RESIGNED, 'EMPLOYEE_RESIGNED');
  }

  const shift = await attendanceRepository.findShiftById(shiftId);
  if (!shift) {
    throw new BadRequestError(Message.ATTENDANCE.SHIFT_NOT_FOUND, 'SHIFT_NOT_FOUND');
  }

  const workDate = parseDateOnly(workDateStr);

  const schedule = await attendanceRepository.findWorkSchedule(employeeId, shiftId, workDate);
  if (!schedule) {
    throw new BadRequestError(Message.ATTENDANCE.NO_WORK_SCHEDULE, 'NO_WORK_SCHEDULE');
  }

  const shiftStartAt = combineDateAndTime(workDate, shift.startTime);
  if (Date.now() < shiftStartAt.getTime() - EARLY_CHECKIN_GRACE_MS) {
    throw new BadRequestError(Message.ATTENDANCE.TOO_EARLY, 'TOO_EARLY');
  }

  const existing = await attendanceRepository.findExistingAttendance(employeeId, shiftId, workDate);
  if (existing) {
    throw new ConflictError(Message.ATTENDANCE.ALREADY_CHECKED_IN, 'ALREADY_CHECKED_IN');
  }

  return attendanceRepository.createCheckIn(employeeId, shiftId, workDate, performedById);
}

export async function checkOut(attendanceId: string, performedById: string) {
  const attendance = await attendanceRepository.findById(attendanceId);
  if (!attendance) {
    throw new NotFoundError(Message.ATTENDANCE.NOT_FOUND, 'ATTENDANCE_NOT_FOUND');
  }
  if (!attendance.checkedInAt) {
    throw new BadRequestError(Message.ATTENDANCE.NOT_CHECKED_IN, 'NOT_CHECKED_IN');
  }
  if (attendance.checkedOutAt) {
    throw new BadRequestError(Message.ATTENDANCE.ALREADY_CHECKED_OUT, 'ALREADY_CHECKED_OUT');
  }


  const positionHistory = await attendanceRepository.findPositionHistoryAt(
    attendance.employeeId,
    attendance.checkedInAt!,
  );
  if (!positionHistory) {
    throw new BadRequestError(Message.ATTENDANCE.NO_POSITION_HISTORY, 'NO_POSITION_HISTORY');
  }

  const salaryRate = await attendanceRepository.findSalaryRateAt(positionHistory.positionId, attendance.workDate);
  if (!salaryRate) {
    throw new BadRequestError(Message.ATTENDANCE.NO_SALARY_RATE, 'NO_SALARY_RATE');
  }

  const checkedOutAt = new Date();
  const hoursWorked = new Prisma.Decimal(checkedOutAt.getTime() - attendance.checkedInAt.getTime()).dividedBy(
    MS_PER_HOUR,
  );
  const rawAmount = hoursWorked.mul(salaryRate.hourlyRate);
  const amount = rawAmount.dividedBy(AMOUNT_ROUND_UNIT).round().mul(AMOUNT_ROUND_UNIT);

  return attendanceRepository.checkOutWithPayment(attendanceId, performedById, checkedOutAt, {
    employeeId: attendance.employeeId,
    positionId: positionHistory.positionId,
    workDate: attendance.workDate,
    hoursWorked,
    hourlyRate: salaryRate.hourlyRate,
    amount,
  });
}

export async function list({ employeeId, from, to, page, limit }: ListAttendanceQuery) {
  const skip = (page - 1) * limit;
  const filters = {
    employeeId,
    from: from ? parseDateOnly(from) : undefined,
    to: to ? parseDateOnly(to) : undefined,
  };

  const [data, total] = await Promise.all([
    attendanceRepository.findMany(filters, skip, limit),
    attendanceRepository.count(filters),
  ]);

  return { data, total, page, limit };
}
