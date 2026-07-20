import { create } from "zustand";
import * as positionApi from "./position.api";
import type { Position, ListPositionParams, CreatePositionInput, UpdatePositionInput } from "./position.types";

interface PositionState {
  data: Position[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;

  fetchAll: (params?: ListPositionParams) => Promise<void>;
  create: (input: CreatePositionInput) => Promise<void>;
  update: (id: string, input: UpdatePositionInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const usePositionStore = create<PositionState>((set, get) => ({
  data: [],
  total: 0,
  page: 1,
  limit: 8,
  loading: false,
  error: null,

  fetchAll: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const result = await positionApi.fetchPositions(params);
      set({ data: result.data, total: result.total, page: result.page, limit: result.limit, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  create: async (input) => {
    await positionApi.createPosition(input);
    await get().fetchAll({ page: get().page, limit: get().limit });
  },

  update: async (id, input) => {
    await positionApi.updatePosition(id, input);
    await get().fetchAll({ page: get().page, limit: get().limit });
  },

  remove: async (id) => {
    await positionApi.deletePosition(id);
    await get().fetchAll({ page: get().page, limit: get().limit });
  },
}));
