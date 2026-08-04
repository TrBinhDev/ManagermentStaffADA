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
  // Avatar cua chinh nguoi dang dang nhap - tach rieng khoi "user" (khong sua auth.types.ts),
  // duoc set khi trang Profile/Detail fetch xong hoac sau khi upload thanh cong, de Sidebar
  // doc chung 1 nguon va tu re-render, khong can F5.
  avatarUrl: string | null;

  setAccessToken: (token: string) => void;
  setAvatarUrl: (url: string | null) => void;
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
  avatarUrl: null,

  setAccessToken: (token) => set({ accessToken: token, isAuthenticated: true }),

  setAvatarUrl: (url) => set({ avatarUrl: url }),

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

      // Nap luon avatarUrl ngay luc bootstrap, khong phu thuoc viec user co
      // ghe trang Profile hay khong - truoc day chi trang Profile moi set
      // avatarUrl, nen sau moi lan F5/mo tab moi, Sidebar mat avatar cho toi
      // khi user vao lai trang Profile. Dung dynamic import de tranh vong
      // lap import (me.api -> apiClient co the phu thuoc nguoc lai auth.store).
      try {
        const meApi = await import("@/features/me/me.api");
        const profile = await meApi.fetchMyProfile();
        if (profile) {
          set({ avatarUrl: profile.avatarUrl ?? null });
        }
      } catch {
        // Khong chan bootstrap chinh neu fetch avatar loi (vd user chua co ho so) -
        // Sidebar se don gian hien fallback initials, khong phai loi nghiem trong.
      }
    } catch {
      set({
        accessToken: null,
        role: null,
        user: null,
        isAuthenticated: false,
      });
    } finally {
      set({ isBootstrapping: false });
    }
  },

  clear: () =>
    set({
      accessToken: null,
      role: null,
      user: null,
      isAuthenticated: false,
      isBootstrapping: false,
      avatarUrl: null,
    }),
}));
