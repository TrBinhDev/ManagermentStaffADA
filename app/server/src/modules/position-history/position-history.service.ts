import { Message } from '../../constants/message.js';
import { NotFoundError } from '../../errors/AppError.js';
import { daysBetween } from '../../utils/date.util.js';
import * as positionHistoryRepository from './position-history.repository.js';

export async function getTimeline(employeeId: string) {
  const employee = await positionHistoryRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(Message.EMPLOYEE.NOT_FOUND, 'EMPLOYEE_NOT_FOUND');
  }

  const rows = await positionHistoryRepository.findByEmployeeId(employeeId);

  return rows.map((row) => ({
    id: row.id,
    position: row.position,
    startDate: row.startDate,
    endDate: row.endDate,
    days: daysBetween(row.startDate, row.endDate ?? new Date()),
  }));
}
