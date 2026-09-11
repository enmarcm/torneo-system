import { Box } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { create } from 'zustand';

/*
  Barra de ruta: una línea naranja de 3px bajo la barra superior que avanza
  rápido hasta el 72%, espera a que llegue el chunk de la pantalla nueva y
  cierra al 100%. Para navegaciones cortas es la única señal de carga que se
  ve; el esqueleto grande queda para cuando de verdad hay que esperar.

  Quién la enciende:
  - cada cambio de ruta, por un instante, así el clic siempre responde;
  - `RouteProgressSignal`, montado como fallback de Suspense, mientras el
    código de la pantalla esté bajando.
*/

interface ProgressStore {
  pending: number;
  start: () => void;
  done: () => void;
}

const useProgressStore = create<ProgressStore>((set) => ({
  pending: 0,
  start: () => set((s) => ({ pending: s.pending + 1 })),
  done: () => set((s) => ({ pending: Math.max(0, s.pending - 1) })),
}));

/** Va dentro del fallback de Suspense: prende al montar, apaga al desmontar. */
export const RouteProgressSignal: React.FC = () => {
  const start = useProgressStore((s) => s.start);
  const done = useProgressStore((s) => s.done);
  useEffect(() => {
    start();
    return done;
  }, [start, done]);
  return null;
};

type Phase = 'idle' | 'run' | 'done' | 'off';

/** Se monta dentro del AppBar, que tiene que ser `position: relative | fixed | sticky`. */
export const RouteProgress: React.FC = () => {
  const pending = useProgressStore((s) => s.pending);
  const { key } = useLocation();
  const [phase, setPhaseState] = useState<Phase>('idle');
  // Los temporizadores leen la fase por ref: la del cierre de `useState` queda vieja.
  const phaseRef = useRef<Phase>('idle');
  const setPhase = (p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  };
  const timers = useRef<number[]>([]);
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const finish = () => {
    setPhase('done');
    timers.current.push(
      window.setTimeout(() => {
        setPhase('off');
        timers.current.push(window.setTimeout(() => setPhase('idle'), 400));
      }, 200),
    );
  };

  const active = pending > 0;
  const activeRef = useRef(active);
  activeRef.current = active;

  // Cada navegación enciende la barra aunque el chunk ya esté en caché: sin
  // espera real cierra a los 120 ms, pero el clic se ve respondido.
  useEffect(() => {
    clear();
    setPhase('run');
    if (!activeRef.current) timers.current.push(window.setTimeout(finish, 120));
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (active) {
      clear();
      setPhase('run');
    } else if (phaseRef.current === 'run') {
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (phase === 'idle') return null;

  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: 3,
        borderRadius: '0 3px 3px 0',
        bgcolor: 'var(--accent)',
        boxShadow: '0 0 10px 1px rgba(255,138,76,0.7)',
        pointerEvents: 'none',
        zIndex: 1,
        width: phase === 'run' ? '72%' : '100%',
        opacity: phase === 'off' ? 0 : 1,
        transition:
          phase === 'run'
            ? 'width 1.4s cubic-bezier(.1,.7,.3,1)'
            : phase === 'done'
              ? 'width 0.18s ease-out'
              : 'opacity 0.25s 0.12s',
      }}
    />
  );
};
