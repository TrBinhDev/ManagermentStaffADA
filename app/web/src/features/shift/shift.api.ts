import { apiClient } from "@/lib/axios";
import type { PaginatedResult } from "@/types/api";
import type { Shift, ListShiftParams, CreateShiftInput, UpdateShiftInput } from "./shift.types";

export async function fetchShifts(params: ListShiftParams): Promise<PaginatedResult<Shift>> {
  const res = await apiClient.get<PaginatedResult<Shift>>("/shifts", { params });
  return res.data;
}

export async function fetchShiftById(id: string): Promise<Shift> {
  const res = await apiClient.get<Shift>(`/shifts/${id}`);
  return res.data;
}

export async function createShift(input: CreateShiftInput): Promise<Shift> {
  const res = await apiClient.post<Shift>("/shifts", input);
  return res.data;
}

export async function updateShift(id: string, input: UpdateShiftInput): Promise<Shift> {
  const res = await apiClient.patch<Shift>(`/shifts/${id}`, input);
  return res.data;
}

export async function deleteShift(id: string): Promise<void> {
  await apiClient.delete(`/shifts/${id}`);
}
