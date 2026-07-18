import { create } from "zustand";
import * as departmentApi from "./department.api";
import type { Department, ListDepartmentParams, CreateDepartmentInput, UpdateDepartmentInput } from "./department.types";

interface DepartmentState {
  data: Department[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;

  fetchAll: (params?: ListDepartmentParams) => Promise<void>;
  create: (input: CreateDepartmentInput) => Promise<void>;
  update: (id: string, input: UpdateDepartmentInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useDepartmentStore = create<DepartmentState>((set, get) => ({
  data: [],
  total: 0,
  page: 1,
  limit: 20,
  loading: false,
  error: null,

  fetchAll: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const result = await departmentApi.fetchDepartments(params);
      set({ data: result.data, total: result.total, page: result.page, limit: result.limit, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  create: async (input) => {
    await departmentApi.createDepartment(input);
    await get().fetchAll({ page: get().page, limit: get().limit });
  },

  update: async (id, input) => {
    await departmentApi.updateDepartment(id, input);
    await get().fetchAll({ page: get().page, limit: get().limit });
  },

  remove: async (id) => {
    await departmentApi.deleteDepartment(id);
    await get().fetchAll({ page: get().page, limit: get().limit });
  },
}));
