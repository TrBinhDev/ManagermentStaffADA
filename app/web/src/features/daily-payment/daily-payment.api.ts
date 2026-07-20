import { apiClient } from "@/lib/axios";
import type { EmployeePaymentsResult, AllPaymentsResult } from "./daily-payment.types";

export async function fetchEmployeePayments(
  employeeId: string,
  month: number,
  year: number,
): Promise<EmployeePaymentsResult> {
  const res = await apiClient.get<EmployeePaymentsResult>(`/employees/${employeeId}/payments`, {
    params: { month, year },
  });
  return res.data;
}

export async function fetchAllPayments(
  month: number,
  year: number,
  employeeId?: string,
): Promise<AllPaymentsResult> {
  const res = await apiClient.get<AllPaymentsResult>("/payments", { params: { month, year, employeeId } });
  return res.data;
}
