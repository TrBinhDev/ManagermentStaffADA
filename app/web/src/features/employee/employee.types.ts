export type EmployeeStatus = "ACTIVE" | "RESIGNED";

export interface Employee {
  id: string;
  code: string;
  fullName: string;
  positionId: string;
  status: EmployeeStatus;
}

export interface EmployeeDetail {
  id: string;
  code: string;
  fullName: string;
  dob: string | null;
  status: EmployeeStatus;
  position: {
    id: string;
    name: string;
    department: { name: string };
  };
}

export interface ListEmployeeParams {
  status?: EmployeeStatus;
  positionId?: string;
  departmentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateEmployeeInput {
  cccd: string;
  fullName: string;
  dob?: string;
  positionId: string;
}

export interface UpdateEmployeeInput {
  fullName?: string;
  dob?: string;
  positionId?: string;
}

export interface RehireEmployeeInput {
  positionId?: string;
}
