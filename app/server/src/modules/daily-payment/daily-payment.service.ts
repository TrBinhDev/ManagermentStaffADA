import { Message } from '../../constants/message.js';
import { NotFoundError } from '../../errors/AppError.js';
import { monthRangeUTC } from '../../utils/date.util.js';
import * as dailyPaymentRepository from './daily-payment.repository.js';
import type { ListEmployeePaymentsQuery, ListAllPaymentsQuery } from './daily-payment.schema.js';

export async function listByEmployee(employeeId: string, { month, year }: ListEmployeePaymentsQuery) {
  const employee = await dailyPaymentRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new NotFoundError(Message.DAILY_PAYMENT.EMPLOYEE_NOT_FOUND, 'EMPLOYEE_NOT_FOUND');
  }

  const { start, end } = monthRangeUTC(year, month);
  const data = await dailyPaymentRepository.findByEmployeeAndRange(employeeId, start, end);

  const totalAmount = data.reduce((sum, row) => sum + Number(row.amount), 0);
  const totalHours = data.reduce((sum, row) => sum + Number(row.hoursWorked), 0);

  return { data, totalAmount, totalHours };
}

export async function listAll({ month, year, employeeId }: ListAllPaymentsQuery) {
  const { start, end } = monthRangeUTC(year, month);
  const rows = await dailyPaymentRepository.findAllByRange(start, end, employeeId);

  const byEmployee = new Map<
    string,
    { employeeId: string; fullName: string; totalAmount: number; totalHours: number }
  >();

  for (const row of rows) {
    if (!byEmployee.has(row.employeeId)) {
      byEmployee.set(row.employeeId, {
        employeeId: row.employeeId,
        fullName: row.employee.fullName,
        totalAmount: 0,
        totalHours: 0,
      });
    }
    const entry = byEmployee.get(row.employeeId)!;
    entry.totalAmount += Number(row.amount);
    entry.totalHours += Number(row.hoursWorked);
  }

  const data = Array.from(byEmployee.values());
  const grandTotal = data.reduce((sum, entry) => sum + entry.totalAmount, 0);

  return { data, grandTotal };
}
