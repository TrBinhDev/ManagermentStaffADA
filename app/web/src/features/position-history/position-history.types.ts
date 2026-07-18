export interface PositionHistoryItem {
  id: string;
  position: { id: string; name: string };
  startDate: string;
  endDate: string | null;
  days: number;
}
