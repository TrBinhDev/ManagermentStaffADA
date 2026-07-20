import { apiClient } from "@/lib/axios";
import type { PaginatedResult } from "@/types/api";
import type { AttendanceItem, CheckInInput, ListAttendanceParams } from "./attendance.types";
import type { DailyPaymentItem } from "@/features/daily-payment/daily-payment.types";

export async function fetchAttendance(params: ListAttendanceParams): Promise<PaginatedResult<AttendanceItem>> {
  const res = await apiClient.get<PaginatedResult<AttendanceItem>>("/attendance", { params });
  return res.data;
}

export async function checkIn(input: CheckInInput): Promise<AttendanceItem> {
  const res = await apiClient.post<AttendanceItem>("/attendance/check-in", input);
  return res.data;
}

export async function checkOut(
  attendanceId: string,
): Promise<{ attendance: AttendanceItem; dailyPayment: DailyPaymentItem }> {
  const res = await apiClient.patch<{ attendance: AttendanceItem; dailyPayment: DailyPaymentItem }>(
    `/attendance/${attendanceId}/check-out`,
  );
  return res.data;
}
