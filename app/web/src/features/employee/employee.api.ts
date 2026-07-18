import { apiClient } from "@/lib/axios";
import type { PaginatedResult } from "@/types/api";
import type {
  Employee,
  EmployeeDetail,
  ListEmployeeParams,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  RehireEmployeeInput,
} from "./employee.types";

export async function fetchEmployees(params: ListEmployeeParams): Promise<PaginatedResult<Employee>> {
  const res = await apiClient.get<PaginatedResult<Employee>>("/employees", { params });
  return res.data;
}

export async function fetchEmployeeById(id: string): Promise<EmployeeDetail> {
  const res = await apiClient.get<EmployeeDetail>(`/employees/${id}`);
  return res.data;
}

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const res = await apiClient.post<Employee>("/employees", input);
  return res.data;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput): Promise<EmployeeDetail> {
  const res = await apiClient.patch<EmployeeDetail>(`/employees/${id}`, input);
  return res.data;
}

export async function deleteEmployee(id: string): Promise<void> {
  await apiClient.delete(`/employees/${id}`);
}

export async function resignEmployee(id: string): Promise<EmployeeDetail> {
  const res = await apiClient.patch<EmployeeDetail>(`/employees/${id}/resign`);
  return res.data;
}

export async function rehireEmployee(id: string, input: RehireEmployeeInput = {}): Promise<EmployeeDetail> {
  const res = await apiClient.patch<EmployeeDetail>(`/employees/${id}/rehire`, input);
  return res.data;
}
