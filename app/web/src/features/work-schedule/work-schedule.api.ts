import { apiClient } from "@/lib/axios";
import type {
  EmployeeWorkScheduleItem,
  WorkScheduleSummaryItem,
  BulkCreateWorkScheduleInput,
  BulkCreateWorkScheduleResult,
  UpdateWorkScheduleInput,
} from "./work-schedule.types";

export async function fetchEmployeeWorkSchedule(
  employeeId: string,
  month: number,
  year: number,
): Promise<EmployeeWorkScheduleItem[]> {
  const res = await apiClient.get<EmployeeWorkScheduleItem[]>(`/employees/${employeeId}/work-schedule`, {
    params: { month, year },
  });
  return res.data;
}

export async function bulkCreateWorkSchedule(
  employeeId: string,
  input: BulkCreateWorkScheduleInput,
): Promise<BulkCreateWorkScheduleResult> {
  const res = await apiClient.post<BulkCreateWorkScheduleResult>(
    `/employees/${employeeId}/work-schedule/bulk`,
    input,
  );
  return res.data;
}

export async function updateWorkSchedule(
  employeeId: string,
  scheduleId: string,
  input: UpdateWorkScheduleInput,
): Promise<EmployeeWorkScheduleItem> {
  const res = await apiClient.patch<EmployeeWorkScheduleItem>(
    `/employees/${employeeId}/work-schedule/${scheduleId}`,
    input,
  );
  return res.data;
}

export async function deleteWorkSchedule(employeeId: string, scheduleId: string): Promise<void> {
  await apiClient.delete(`/employees/${employeeId}/work-schedule/${scheduleId}`);
}

export async function fetchAllWorkSchedule(
  month: number,
  year: number,
  shiftId?: string,
): Promise<WorkScheduleSummaryItem[]> {
  const res = await apiClient.get<WorkScheduleSummaryItem[]>("/work-schedule", {
    params: { month, year, shiftId },
  });
  return res.data;
}
