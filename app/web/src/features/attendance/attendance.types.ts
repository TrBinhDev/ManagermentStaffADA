export interface AttendanceItem {
  id: string;
  employeeId: string;
  shiftId: string;
  workDate: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  employee: { id: string; code: string; fullName: string };
  shift: { id: string; name: string; startTime: string; endTime: string };
}

export interface CheckInInput {
  employeeId: string;
  shiftId: string;
  workDate: string;
}

export interface ListAttendanceParams {
  employeeId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
