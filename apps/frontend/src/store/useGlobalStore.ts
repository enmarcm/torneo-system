import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type State = {
  mode: 'light' | 'dark';
  sidebarCollapsed: boolean;
  /** Plegado de la barra lateral del sitio público, aparte del de los paneles con sesión. */
  publicNavCollapsed: boolean;
  selectedEditionId: string | null;
  toggleMode: () => void;
  setMode: (m: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  togglePublicNav: () => void;
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
      publicNavCollapsed: false,
      selectedEditionId: null,
      toggleMode: () => set((s) => ({ mode: s.mode === 'light' ? 'dark' : 'light' })),
      setMode: (mode) => set({ mode }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      togglePublicNav: () => set((s) => ({ publicNavCollapsed: !s.publicNavCollapsed })),
      setSelectedEditionId: (selectedEditionId) => set({ selectedEditionId }),
    }),
    { name: 'torneo-global' },
  ),
);
