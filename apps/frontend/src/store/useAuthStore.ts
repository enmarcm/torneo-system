import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'TEAM_LEADER';
  teamId: string | null;
};

type State = {
  user: AuthUser | null;
  accessToken: string | null;
  setSession: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
};

export const useAuthStore = create<State>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setSession: (user, accessToken) => set({ user, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'torneo-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
    },
  ),
);
