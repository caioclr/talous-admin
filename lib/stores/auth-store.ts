import { create } from "zustand";
import { setAccessToken } from "@/lib/services/client";
import type { AuthUser } from "@/lib/types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  finishBoot: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isReady: false,

  setAuth: (user, token) => {
    setAccessToken(token);
    set({
      user,
      accessToken: token,
      isAuthenticated: true,
      isReady: true,
    });
  },

  clearAuth: () => {
    setAccessToken(null);
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isReady: true,
    });
  },

  finishBoot: () => {
    set((state) => ({
      isReady: true,
      user: state.user,
      accessToken: state.accessToken,
      isAuthenticated: state.isAuthenticated,
    }));
  },
}));
