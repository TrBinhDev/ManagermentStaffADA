import { create } from "zustand";
import * as shiftApi from "./shift.api";
import type { Shift, ListShiftParams, CreateShiftInput, UpdateShiftInput } from "./shift.types";

interface ShiftState {
  data: Shift[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;

  fetchAll: (params?: ListShiftParams) => Promise<void>;
  create: (input: CreateShiftInput) => Promise<void>;
  update: (id: string, input: UpdateShiftInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useShiftStore = create<ShiftState>((set, get) => {
  let lastParams: ListShiftParams = {};

  return {
    data: [],
    total: 0,
    page: 1,
    limit: 20,
    loading: false,
    error: null,

    fetchAll: async (params = {}) => {
      lastParams = params;
      set({ loading: true, error: null });
      try {
        const result = await shiftApi.fetchShifts(params);
        set({ data: result.data, total: result.total, page: result.page, limit: result.limit, loading: false });
      } catch (err) {
        set({ error: (err as Error).message, loading: false });
      }
    },

    create: async (input) => {
      await shiftApi.createShift(input);
      await get().fetchAll(lastParams);
    },

    update: async (id, input) => {
      await shiftApi.updateShift(id, input);
      await get().fetchAll(lastParams);
    },

    remove: async (id) => {
      await shiftApi.deleteShift(id);
      await get().fetchAll(lastParams);
    },
  };
});
