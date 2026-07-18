import { apiClient } from "@/lib/axios";
import type { PositionHistoryItem } from "./position-history.types";

export async function fetchPositionHistory(employeeId: string): Promise<PositionHistoryItem[]> {
  const res = await apiClient.get<PositionHistoryItem[]>(`/employees/${employeeId}/position-history`);
  return res.data;
}
