import { create } from "zustand";
import * as authApi from "./auth.api";
import type { Me, ManagerRole } from "./auth.types";

interface AuthState {
  accessToken: string | null;
  role: ManagerRole | null;
  user: Me | null;
  isAuthenticated: boolean;
  // true trong luc app moi load, dang goi /auth/refresh de khoi phuc session tu cookie.
  isBootstrapping: boolean;

  setAccessToken: (token: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  role: null,
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,

  setAccessToken: (token) => set({ accessToken: token, isAuthenticated: true }),

  login: async (email, password) => {
    const { token, role } = await authApi.login({ email, password });
    set({ accessToken: token, role, isAuthenticated: true });
    const user = await authApi.me();
    set({ user });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      get().clear();
    }
  },

  // Goi 1 lan luc app khoi dong (xem app/providers.tsx) - dung refresh-token cookie
  // httpOnly de lay lai access token moi, vi access token chi song trong memory (zustand),
  // F5 lai trang la mat, khong lay lai tu cookie thi se bi coi nhu dang xuat.
  bootstrap: async () => {
    try {
      const { token } = await authApi.refresh();
      set({ accessToken: token, isAuthenticated: true });
      const user = await authApi.me();
      set({ user, role: user.role });
    } catch {
      set({ accessToken: null, role: null, user: null, isAuthenticated: false });
    } finally {
      set({ isBootstrapping: false });
    }
  },

  clear: () => set({ accessToken: null, role: null, user: null, isAuthenticated: false, isBootstrapping: false }),
}));
