import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type State = {
  mode: 'light' | 'dark';
  selectedEditionId: string | null;
  toggleMode: () => void;
  setMode: (m: 'light' | 'dark') => void;
  setSelectedEditionId: (id: string | null) => void;
};

export const useGlobalStore = create<State>()(
  persist(
    (set) => ({
      mode: 'light',
      selectedEditionId: null,
      toggleMode: () => set((s) => ({ mode: s.mode === 'light' ? 'dark' : 'light' })),
      setMode: (mode) => set({ mode }),
      setSelectedEditionId: (selectedEditionId) => set({ selectedEditionId }),
    }),
    { name: 'torneo-global' },
  ),
);
