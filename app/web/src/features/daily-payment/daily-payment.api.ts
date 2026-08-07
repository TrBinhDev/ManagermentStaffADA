import { apiClient } from "@/lib/axios";
import type {
  EmployeePaymentsResult,
  AllPaymentsResult,
  PaymentSummaryResult,
} from "./daily-payment.types";

export async function fetchEmployeePayments(
  employeeId: string,
  month: number,
  year: number,
): Promise<EmployeePaymentsResult> {
  const res = await apiClient.get<EmployeePaymentsResult>(
    `/employees/${employeeId}/payments`,
    {
      params: { month, year },
    },
  );
  return res.data;
}

export interface FetchAllPaymentsParams {
  employeeId?: string;
  search?: string;
  sortBy?: "name" | "amount";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export async function fetchAllPayments(
  month: number,
  year: number,
  params: FetchAllPaymentsParams = {},
): Promise<AllPaymentsResult> {
  const res = await apiClient.get<AllPaymentsResult>("/payments", {
    params: { month, year, ...params },
  });
  return res.data;
}

// Tổng lương toàn nhà hàng trong tháng - endpoint riêng, không phân trang
export async function fetchPaymentsSummary(
  month: number,
  year: number,
): Promise<PaymentSummaryResult> {
  const res = await apiClient.get<PaymentSummaryResult>("/payments/summary", {
    params: { month, year },
  });
  return res.data;
}
