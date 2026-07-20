export interface PositionSalaryRate {
  id: string;
  positionId: string;
  hourlyRate: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface CreateSalaryRateInput {
  hourlyRate: number;
}
