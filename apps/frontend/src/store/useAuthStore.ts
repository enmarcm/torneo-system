import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queryClient } from '@/lib/queryClient';
import type { UserRole } from '@/utils/roles';

export type AuthUser = {
  id: string;
  /** Con lo que se entra al sistema. */
  username: string;
  /** Dato de contacto, lo carga el propio usuario desde su panel. */
  email: string | null;
  role: UserRole;
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
    (set, get) => ({
      user: null,
      accessToken: null,
      setSession: (user, accessToken) => {
        const previous = get().user;
        if (previous?.id !== user.id || previous?.role !== user.role || previous?.teamId !== user.teamId) queryClient.clear();
        set({ user, accessToken });
      },
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => {
        const previous = get().user;
        if (previous?.id !== user.id || previous?.role !== user.role || previous?.teamId !== user.teamId) queryClient.clear();
        set({ user });
      },
      logout: () => { queryClient.clear(); set({ user: null, accessToken: null }); },
    }),
    {
      name: 'torneo-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
    },
  ),
);
