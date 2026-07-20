export interface ShiftPositionCapacity {
  id: string;
  shiftId: string;
  positionId: string;
  maxStaff: number;
  position: { id: string; name: string; department: { name: string } };
}

export interface CreateCapacityInput {
  positionId: string;
  maxStaff: number;
}

export interface UpdateCapacityInput {
  maxStaff: number;
}
