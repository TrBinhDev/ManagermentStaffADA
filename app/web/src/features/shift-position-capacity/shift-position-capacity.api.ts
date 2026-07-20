import { apiClient } from "@/lib/axios";
import type { ShiftPositionCapacity, CreateCapacityInput, UpdateCapacityInput } from "./shift-position-capacity.types";

export async function fetchCapacities(shiftId: string): Promise<ShiftPositionCapacity[]> {
  const res = await apiClient.get<ShiftPositionCapacity[]>(`/shifts/${shiftId}/capacities`);
  return res.data;
}

export async function createCapacity(
  shiftId: string,
  input: CreateCapacityInput,
): Promise<ShiftPositionCapacity> {
  const res = await apiClient.post<ShiftPositionCapacity>(`/shifts/${shiftId}/capacities`, input);
  return res.data;
}

export async function updateCapacity(
  shiftId: string,
  capacityId: string,
  input: UpdateCapacityInput,
): Promise<ShiftPositionCapacity> {
  const res = await apiClient.patch<ShiftPositionCapacity>(`/shifts/${shiftId}/capacities/${capacityId}`, input);
  return res.data;
}

export async function deleteCapacity(shiftId: string, capacityId: string): Promise<void> {
  await apiClient.delete(`/shifts/${shiftId}/capacities/${capacityId}`);
}
