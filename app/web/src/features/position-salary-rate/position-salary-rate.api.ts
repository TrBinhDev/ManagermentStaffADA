import { apiClient } from "@/lib/axios";
import type { PositionSalaryRate, CreateSalaryRateInput } from "./position-salary-rate.types";

export async function fetchSalaryRates(positionId: string): Promise<PositionSalaryRate[]> {
  const res = await apiClient.get<PositionSalaryRate[]>(`/positions/${positionId}/salary-rates`);
  return res.data;
}

export async function createSalaryRate(
  positionId: string,
  input: CreateSalaryRateInput,
): Promise<PositionSalaryRate> {
  const res = await apiClient.post<PositionSalaryRate>(`/positions/${positionId}/salary-rates`, input);
  return res.data;
}
