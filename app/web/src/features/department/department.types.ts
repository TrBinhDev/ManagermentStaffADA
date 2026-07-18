export interface Department {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListDepartmentParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateDepartmentInput {
  name: string;
}

export interface UpdateDepartmentInput {
  name?: string;
}
