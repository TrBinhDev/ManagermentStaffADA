import { create } from "zustand";
import * as managerAccountApi from "./manager-account.api";
import type {
  ManagerAccount,
  ListManagerAccountParams,
  CreateManagerAccountInput,
  ResetPasswordInput,
} from "./manager-account.types";

interface ManagerAccountState {
  data: ManagerAccount[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;

  fetchAll: (params?: ListManagerAccountParams) => Promise<void>;
  create: (input: CreateManagerAccountInput) => Promise<void>;
  setActive: (id: string, isActive: boolean) => Promise<void>;
  resetPassword: (id: string, input: ResetPasswordInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useManagerAccountStore = create<ManagerAccountState>((set, get) => ({
  data: [],
  total: 0,
  page: 1,
  limit: 8,
  loading: false,
  error: null,

  fetchAll: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const result = await managerAccountApi.fetchManagerAccounts(params);
      set({ data: result.data, total: result.total, page: result.page, limit: result.limit, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  create: async (input) => {
    await managerAccountApi.createManagerAccount(input);
    await get().fetchAll({ page: get().page, limit: get().limit });
  },

  setActive: async (id, isActive) => {
    await managerAccountApi.updateManagerAccount(id, { isActive });
    await get().fetchAll({ page: get().page, limit: get().limit });
  },

  resetPassword: async (id, input) => {
    await managerAccountApi.resetManagerAccountPassword(id, input);
  },

  remove: async (id) => {
    await managerAccountApi.deleteManagerAccount(id);
    await get().fetchAll({ page: get().page, limit: get().limit });
  },
}));
