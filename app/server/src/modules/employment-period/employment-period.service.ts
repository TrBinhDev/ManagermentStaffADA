import { Message } from '../../constants/message.js';
import { NotFoundError } from '../../errors/AppError.js';
import { daysBetween } from '../../utils/date.util.js';
import * as employmentPeriodRepository from './employment-period.repository.js';

export async function getTimeline(employeeId: string) {
  const employee = await employmentPeriodRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(Message.EMPLOYEE.NOT_FOUND, 'EMPLOYEE_NOT_FOUND');
  }

  const rows = await employmentPeriodRepository.findByEmployeeId(employeeId);

  return rows.map((row) => ({
    id: row.id,
    startDate: row.startDate,
    endDate: row.endDate,
    days: daysBetween(row.startDate, row.endDate ?? new Date()),
  }));
}
