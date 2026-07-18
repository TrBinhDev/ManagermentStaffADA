import { apiClient } from "@/lib/axios";
import type { PaginatedResult } from "@/types/api";
import type {
  ManagerAccount,
  ListManagerAccountParams,
  CreateManagerAccountInput,
  UpdateManagerAccountInput,
  ResetPasswordInput,
} from "./manager-account.types";

export async function fetchManagerAccounts(
  params: ListManagerAccountParams,
): Promise<PaginatedResult<ManagerAccount>> {
  const res = await apiClient.get<PaginatedResult<ManagerAccount>>("/manager-accounts", { params });
  return res.data;
}

export async function fetchManagerAccountById(id: string): Promise<ManagerAccount> {
  const res = await apiClient.get<ManagerAccount>(`/manager-accounts/${id}`);
  return res.data;
}

export async function createManagerAccount(input: CreateManagerAccountInput): Promise<ManagerAccount> {
  const res = await apiClient.post<ManagerAccount>("/manager-accounts", input);
  return res.data;
}

export async function updateManagerAccount(id: string, input: UpdateManagerAccountInput): Promise<ManagerAccount> {
  const res = await apiClient.patch<ManagerAccount>(`/manager-accounts/${id}`, input);
  return res.data;
}

export async function resetManagerAccountPassword(id: string, input: ResetPasswordInput): Promise<void> {
  await apiClient.patch(`/manager-accounts/${id}/reset-password`, input);
}

export async function deleteManagerAccount(id: string): Promise<void> {
  await apiClient.delete(`/manager-accounts/${id}`);
}
