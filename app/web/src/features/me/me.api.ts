import { apiClient } from "@/lib/axios";
import type { PaginatedResult } from "@/types/api";
import type { EmployeeWorkScheduleItem } from "@/features/work-schedule/work-schedule.types";
import type { AttendanceItem } from "@/features/attendance/attendance.types";
import type { EmployeePaymentsResult } from "@/features/daily-payment/daily-payment.types";
import type { EmployeeProfile } from "@/features/employee-profile/employee-profile.types";
import type { MeUpdateProfileInput, MeAttendanceParams } from "./me.types";

export async function fetchMyWorkSchedule(month: number, year: number): Promise<EmployeeWorkScheduleItem[]> {
  const res = await apiClient.get<EmployeeWorkScheduleItem[]>("/me/work-schedule", { params: { month, year } });
  return res.data;
}

export async function fetchMyAttendance(params: MeAttendanceParams): Promise<PaginatedResult<AttendanceItem>> {
  const res = await apiClient.get<PaginatedResult<AttendanceItem>>("/me/attendance", { params });
  return res.data;
}

export async function fetchMyPayments(month: number, year: number): Promise<EmployeePaymentsResult> {
  const res = await apiClient.get<EmployeePaymentsResult>("/me/payments", { params: { month, year } });
  return res.data;
}

export async function fetchMyProfile(): Promise<EmployeeProfile | null> {
  const res = await apiClient.get<EmployeeProfile | null>("/me/profile");
  return res.data;
}

export async function updateMyProfile(input: MeUpdateProfileInput): Promise<EmployeeProfile> {
  const res = await apiClient.patch<EmployeeProfile>("/me/profile", input);
  return res.data;
}
