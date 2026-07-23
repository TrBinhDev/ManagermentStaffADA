import * as workScheduleService from '../work-schedule/work-schedule.service.js';
import type { ListEmployeeWorkScheduleQuery } from '../work-schedule/work-schedule.schema.js';
import * as attendanceService from '../attendance/attendance.service.js';
import * as dailyPaymentService from '../daily-payment/daily-payment.service.js';
import type { ListEmployeePaymentsQuery } from '../daily-payment/daily-payment.schema.js';
import * as employeeProfileService from '../employee-profile/employee-profile.service.js';
import type { MeAttendanceQuery, MeUpdateProfileInput } from './me.schema.js';


export function listWorkSchedule(employeeId: string, query: ListEmployeeWorkScheduleQuery) {
  return workScheduleService.listByEmployee(employeeId, query);
}

export function listAttendance(employeeId: string, query: MeAttendanceQuery) {
  return attendanceService.list({ ...query, employeeId });
}

export function listPayments(employeeId: string, query: ListEmployeePaymentsQuery) {
  return dailyPaymentService.listByEmployee(employeeId, query);
}

export function getProfile(employeeId: string) {
  return employeeProfileService.getProfile(employeeId);
}

export function updateProfile(employeeId: string, input: MeUpdateProfileInput) {
  return employeeProfileService.upsertProfile(employeeId, input);
}
