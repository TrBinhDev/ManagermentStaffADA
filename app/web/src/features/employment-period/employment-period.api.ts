import { apiClient } from "@/lib/axios";
import type { EmploymentPeriodItem } from "./employment-period.types";

export async function fetchEmploymentPeriods(employeeId: string): Promise<EmploymentPeriodItem[]> {
  const res = await apiClient.get<EmploymentPeriodItem[]>(`/employees/${employeeId}/employment-periods`);
  return res.data;
}
