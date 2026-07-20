import { create } from "zustand";
import * as employeeApi from "./employee.api";
import type { Employee, ListEmployeeParams, CreateEmployeeInput, UpdateEmployeeInput } from "./employee.types";

interface EmployeeState {
  data: Employee[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;

  fetchAll: (params?: ListEmployeeParams) => Promise<void>;
  create: (input: CreateEmployeeInput) => Promise<void>;
  update: (id: string, input: UpdateEmployeeInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  resign: (id: string) => Promise<void>;
  rehire: (id: string, positionId?: string) => Promise<void>;
}

export const useEmployeeStore = create<EmployeeState>((set, get) => {
  // Giu lai filter dang dung de refetch dung sau khi tao/sua/xoa/resign/rehire.
  let lastParams: ListEmployeeParams = {};

  return {
    data: [],
    total: 0,
    page: 1,
    limit: 8,
    loading: false,
    error: null,

    fetchAll: async (params = {}) => {
      lastParams = params;
      set({ loading: true, error: null });
      try {
        const result = await employeeApi.fetchEmployees(params);
        set({ data: result.data, total: result.total, page: result.page, limit: result.limit, loading: false });
      } catch (err) {
        set({ error: (err as Error).message, loading: false });
      }
    },

    create: async (input) => {
      await employeeApi.createEmployee(input);
      await get().fetchAll(lastParams);
    },

    update: async (id, input) => {
      await employeeApi.updateEmployee(id, input);
      await get().fetchAll(lastParams);
    },

    remove: async (id) => {
      await employeeApi.deleteEmployee(id);
      await get().fetchAll(lastParams);
    },

    resign: async (id) => {
      await employeeApi.resignEmployee(id);
      await get().fetchAll(lastParams);
    },

    rehire: async (id, positionId) => {
      await employeeApi.rehireEmployee(id, { positionId });
      await get().fetchAll(lastParams);
    },
  };
});
