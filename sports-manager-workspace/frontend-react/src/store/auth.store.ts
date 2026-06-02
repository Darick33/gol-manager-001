import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'auth-storage',
      // Migration guard: if token exists but user.leagueId is undefined
      // (old token pre-multitenancy), force logout to avoid stale state.
      onRehydrateStorage: () => (state) => {
        if (state?.token && state.user && state.user.leagueId === undefined) {
          state.user = null;
          state.token = null;
        }
      },
    },
  ),
);
