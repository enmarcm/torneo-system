import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type State = {
  mode: 'light' | 'dark';
  sidebarCollapsed: boolean;
  selectedEditionId: string | null;
  toggleMode: () => void;
  setMode: (m: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSelectedEditionId: (id: string | null) => void;
};

export const useGlobalStore = create<State>()(
  persist(
    (set) => ({
      /*
        El norte creativo del sistema se llama "La Cancha de Noche" y el default
        era blanco a todo brillo. Ahora se arranca en lo que el visitante ya
        eligió en su teléfono; el interruptor sigue mandando por encima.
      */
      mode:
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light',
      sidebarCollapsed: false,
      selectedEditionId: null,
      toggleMode: () => set((s) => ({ mode: s.mode === 'light' ? 'dark' : 'light' })),
      setMode: (mode) => set({ mode }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSelectedEditionId: (selectedEditionId) => set({ selectedEditionId }),
    }),
    { name: 'torneo-global' },
  ),
);
