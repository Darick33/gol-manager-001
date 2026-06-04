import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  activeLeagueId: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  setActiveLeagueId: (id: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      activeLeagueId: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null, activeLeagueId: null }),
      isAuthenticated: () => !!get().token,
      setActiveLeagueId: (id) => set({ activeLeagueId: id }),
    }),
    {
      name: 'auth-storage',
      // Migration guard: if token exists but user.leagueId is undefined
      // (old token pre-multitenancy), force logout to avoid stale state.
      onRehydrateStorage: () => (state) => {
        if (state?.token && state.user && state.user.leagueId === undefined) {
          state.user = null;
          state.token = null;
          state.activeLeagueId = null;
        }
      },
    },
  ),
);
