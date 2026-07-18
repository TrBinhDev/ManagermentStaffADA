import { apiClient } from "@/lib/axios";
import type { PaginatedResult } from "@/types/api";
import type { Department, ListDepartmentParams, CreateDepartmentInput, UpdateDepartmentInput } from "./department.types";

export async function fetchDepartments(params: ListDepartmentParams): Promise<PaginatedResult<Department>> {
  const res = await apiClient.get<PaginatedResult<Department>>("/departments", { params });
  return res.data;
}

export async function fetchDepartmentById(id: string): Promise<Department> {
  const res = await apiClient.get<Department>(`/departments/${id}`);
  return res.data;
}

export async function createDepartment(input: CreateDepartmentInput): Promise<Department> {
  const res = await apiClient.post<Department>("/departments", input);
  return res.data;
}

export async function updateDepartment(id: string, input: UpdateDepartmentInput): Promise<Department> {
  const res = await apiClient.patch<Department>(`/departments/${id}`, input);
  return res.data;
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiClient.delete(`/departments/${id}`);
}
