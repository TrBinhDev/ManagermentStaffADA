export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListShiftParams {
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateShiftInput {
  name: string;
  startTime: string;
  endTime: string;
}

export interface UpdateShiftInput {
  name?: string;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}
