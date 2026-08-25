import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type State = {
  mode: 'light' | 'dark';
  sidebarCollapsed: boolean;
  selectedEditionId: string | null;
  /*
    Hay una portada a pantalla completa debajo de la barra superior. Lo enciende
    la propia portada al montarse: la barra necesita saberlo para volverse
    transparente, y no puede deducirlo de la ruta porque la portada solo existe
    cuando hay una edición en curso.
  */
  publicHeroActive: boolean;
  toggleMode: () => void;
  setMode: (m: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSelectedEditionId: (id: string | null) => void;
  setPublicHeroActive: (v: boolean) => void;
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
      publicHeroActive: false,
      toggleMode: () => set((s) => ({ mode: s.mode === 'light' ? 'dark' : 'light' })),
      setMode: (mode) => set({ mode }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSelectedEditionId: (selectedEditionId) => set({ selectedEditionId }),
      setPublicHeroActive: (publicHeroActive) => set({ publicHeroActive }),
    }),
    {
      name: 'torneo-global',
      /*
        Solo se guardan las preferencias. `publicHeroActive` describe qué hay en
        pantalla ahora: guardarlo haría que la barra arrancara transparente en
        una página sin portada, con el texto blanco sobre fondo blanco.
      */
      partialize: (s) => ({
        mode: s.mode,
        sidebarCollapsed: s.sidebarCollapsed,
        selectedEditionId: s.selectedEditionId,
      }),
    },
  ),
);
