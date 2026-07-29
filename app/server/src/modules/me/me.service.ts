import * as workScheduleService from "../work-schedule/work-schedule.service.js";
import type { ListEmployeeWorkScheduleQuery } from "../work-schedule/work-schedule.schema.js";
import * as attendanceService from "../attendance/attendance.service.js";
import * as dailyPaymentService from "../daily-payment/daily-payment.service.js";
import type { ListEmployeePaymentsQuery } from "../daily-payment/daily-payment.schema.js";
import * as employeeProfileService from "../employee-profile/employee-profile.service.js";
import type { MeAttendanceQuery, MeUpdateProfileInput } from "./me.schema.js";

// Lấy lịch làm việc của nhân viên -> ủy quyền lại (delegate) cho service của module work-schedule, không viết lại logic
export function listWorkSchedule(
  employeeId: string,
  query: ListEmployeeWorkScheduleQuery,
) {
  return workScheduleService.listByEmployee(employeeId, query);
}

// Lấy lịch sử chấm công của nhân viên -> tái sử dụng attendanceService.list, ép cứng employeeId vào filter
// (đảm bảo dù query có gì thì cũng chỉ trả về dữ liệu của đúng employeeId này, không thể xem người khác)
export function listAttendance(employeeId: string, query: MeAttendanceQuery) {
  return attendanceService.list({ ...query, employeeId });
}

// Lấy lương của nhân viên -> ủy quyền lại cho service của module daily-payment
export function listPayments(
  employeeId: string,
  query: ListEmployeePaymentsQuery,
) {
  return dailyPaymentService.listByEmployee(employeeId, query);
}

// Lấy hồ sơ cá nhân -> ủy quyền lại cho service của module employee-profile
export function getProfile(employeeId: string) {
  return employeeProfileService.getProfile(employeeId);
}

// Cập nhật hồ sơ cá nhân -> ủy quyền lại cho employeeProfileService.upsertProfile
// (input đã được giới hạn trường từ meUpdateProfileSchema nên dù dùng chung hàm upsert với module quản trị
// vẫn không thể sửa các trường nhạy cảm như cccd, note...)
export function updateProfile(employeeId: string, input: MeUpdateProfileInput) {
  return employeeProfileService.upsertProfile(employeeId, input);
}
