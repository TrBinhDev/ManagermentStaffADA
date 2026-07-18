import { apiClient } from "@/lib/axios";
import type { PaginatedResult } from "@/types/api";
import type { Position, ListPositionParams, CreatePositionInput, UpdatePositionInput } from "./position.types";

export async function fetchPositions(params: ListPositionParams): Promise<PaginatedResult<Position>> {
  const res = await apiClient.get<PaginatedResult<Position>>("/positions", { params });
  return res.data;
}

export async function fetchPositionById(id: string): Promise<Position> {
  const res = await apiClient.get<Position>(`/positions/${id}`);
  return res.data;
}

export async function createPosition(input: CreatePositionInput): Promise<Position> {
  const res = await apiClient.post<Position>("/positions", input);
  return res.data;
}

export async function updatePosition(id: string, input: UpdatePositionInput): Promise<Position> {
  const res = await apiClient.patch<Position>(`/positions/${id}`, input);
  return res.data;
}

export async function deletePosition(id: string): Promise<void> {
  await apiClient.delete(`/positions/${id}`);
}
