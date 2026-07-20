export interface WorkScheduleShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface EmployeeWorkScheduleItem {
  id: string;
  employeeId: string;
  shiftId: string;
  workDate: string;
  shift: WorkScheduleShift;
}

export interface WorkScheduleSummaryItem extends EmployeeWorkScheduleItem {
  employee: { id: string; code: string; fullName: string };
}

export interface BulkCreateWorkScheduleInput {
  shiftId: string;
  workDates: string[];
}

export interface BulkCreateWorkScheduleResult {
  created: string[];
  rejected: string[];
}

export interface UpdateWorkScheduleInput {
  shiftId: string;
}
