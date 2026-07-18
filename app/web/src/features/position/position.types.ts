export interface Position {
  id: string;
  name: string;
  departmentId: string;
  department: { id: string; name: string } | { name: string };
  createdAt: string;
  updatedAt: string;
}

export interface ListPositionParams {
  departmentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreatePositionInput {
  name: string;
  departmentId: string;
}

export interface UpdatePositionInput {
  name?: string;
  departmentId?: string;
}
