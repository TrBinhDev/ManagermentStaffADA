import { Message } from '../../constants/message.js';
import { BadRequestError, NotFoundError } from '../../errors/AppError.js';
import { monthRangeUTC, parseDateOnly } from '../../utils/date.util.js';
import { findExistingAttendance } from '../attendance/attendance.repository.js';
import * as workScheduleRepository from './work-schedule.repository.js';
import type {
  ListEmployeeWorkScheduleQuery,
  ListAllWorkScheduleQuery,
  BulkCreateWorkScheduleInput,
  UpdateWorkScheduleInput,
} from './work-schedule.schema.js';

export async function listByEmployee(employeeId: string, { month, year }: ListEmployeeWorkScheduleQuery) {
  const employee = await workScheduleRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(Message.WORK_SCHEDULE.EMPLOYEE_NOT_FOUND, 'EMPLOYEE_NOT_FOUND');
  }

  const { start, end } = monthRangeUTC(year, month);
  return workScheduleRepository.findByEmployeeAndRange(employeeId, start, end);
}

export async function listAll({ month, year, shiftId }: ListAllWorkScheduleQuery) {
  const { start, end } = monthRangeUTC(year, month);
  return workScheduleRepository.findAllByRange(start, end, shiftId);
}

// Tra ve { created, rejected } thay vi nem loi khi 1 ngay bi day cho — moi ngay xu ly doc lap,
// FE can biet chinh xac ngay nao thanh cong / ngay nao bi tu choi vi day vi tri trong ca.
export async function bulkCreate(employeeId: string, { shiftId, workDates }: BulkCreateWorkScheduleInput) {
  const employee = await workScheduleRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(Message.WORK_SCHEDULE.EMPLOYEE_NOT_FOUND, 'EMPLOYEE_NOT_FOUND');
  }
  if (employee.status !== 'ACTIVE') {
    throw new BadRequestError(Message.WORK_SCHEDULE.EMPLOYEE_RESIGNED, 'EMPLOYEE_RESIGNED');
  }

  const shift = await workScheduleRepository.findShiftById(shiftId);
  if (!shift) {
    throw new BadRequestError(Message.WORK_SCHEDULE.SHIFT_NOT_FOUND, 'SHIFT_NOT_FOUND');
  }

  const capacity = await workScheduleRepository.findCapacity(shiftId, employee.positionId);

  const created: string[] = [];
  const rejected: string[] = [];

  for (const dateStr of workDates) {
    const workDate = parseDateOnly(dateStr);

    // Da xep dung ngay/ca nay roi (vd bam lai) - coi la thanh cong, khong bao loi/tinh vao rejected.
    const existing = await workScheduleRepository.findExisting(employeeId, shiftId, workDate);
    if (existing) {
      created.push(dateStr);
      continue;
    }

    if (capacity) {
      const count = await workScheduleRepository.countSamePositionInShift(shiftId, workDate, employee.positionId);
      if (count >= capacity.maxStaff) {
        rejected.push(dateStr);
        continue;
      }
    }

    await workScheduleRepository.create(employeeId, shiftId, workDate);
    created.push(dateStr);
  }

  return { created, rejected };
}

export async function updateShift(scheduleId: string, employeeId: string, { shiftId }: UpdateWorkScheduleInput) {
  const schedule = await workScheduleRepository.findScheduleById(scheduleId);
  if (!schedule || schedule.employeeId !== employeeId) {
    throw new NotFoundError(Message.WORK_SCHEDULE.NOT_FOUND, 'WORK_SCHEDULE_NOT_FOUND');
  }

  const shift = await workScheduleRepository.findShiftById(shiftId);
  if (!shift) {
    throw new BadRequestError(Message.WORK_SCHEDULE.SHIFT_NOT_FOUND, 'SHIFT_NOT_FOUND');
  }

  const employee = await workScheduleRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(Message.WORK_SCHEDULE.EMPLOYEE_NOT_FOUND, 'EMPLOYEE_NOT_FOUND');
  }

  const capacity = await workScheduleRepository.findCapacity(shiftId, employee.positionId);
  if (capacity) {
    const count = await workScheduleRepository.countSamePositionInShift(
      shiftId,
      schedule.workDate,
      employee.positionId,
      scheduleId,
    );
    if (count >= capacity.maxStaff) {
      throw new BadRequestError(Message.WORK_SCHEDULE.SHIFT_FULL, 'SHIFT_FULL');
    }
  }

  return workScheduleRepository.updateShift(scheduleId, shiftId);
}

export async function remove(scheduleId: string, employeeId: string): Promise<void> {
  const schedule = await workScheduleRepository.findScheduleById(scheduleId);
  if (!schedule || schedule.employeeId !== employeeId) {
    throw new NotFoundError(Message.WORK_SCHEDULE.NOT_FOUND, 'WORK_SCHEDULE_NOT_FOUND');
  }

  // Da cham cong cho dung ca/ngay nay roi thi khong duoc go, tranh Attendance/DailyPayment
  // con lai tro toi 1 ca lam da bi xoa khoi lich.
  const attendance = await findExistingAttendance(schedule.employeeId, schedule.shiftId, schedule.workDate);
  if (attendance) {
    throw new BadRequestError(Message.WORK_SCHEDULE.HAS_ATTENDANCE, 'WORK_SCHEDULE_HAS_ATTENDANCE');
  }

  await workScheduleRepository.remove(scheduleId);
}
