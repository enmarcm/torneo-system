import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { PageLoader } from './PageLoader';

/** Cuánto se sostiene la portada de carga, aunque la app ya esté lista. */
export const SPLASH_MS = 3000;
const FADE_MS = 350;

/*
  Portada de carga de la primera visita. El balón y las letras se ven completos
  durante tres segundos en cada carga de la página (entrar, recargar), no en
  las navegaciones internas. Va como velo por encima de la app, no en lugar de
  ella: mientras el balón rueda, la pantalla de abajo ya está bajando datos y
  dibujándose, así cuando el velo se levanta no hay un segundo loader detrás.
*/
export const SplashGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phase, setPhase] = useState<'hold' | 'fade' | 'done'>('hold');

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase('fade'), SPLASH_MS);
    const t2 = window.setTimeout(() => setPhase('done'), SPLASH_MS + FADE_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return (
    <>
      {children}
      {phase !== 'done' && (
        <Box
          aria-hidden={phase === 'fade'}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: (t) => t.zIndex.tooltip + 10,
            bgcolor: 'background.default',
            display: 'grid',
            placeItems: 'center',
            opacity: phase === 'fade' ? 0 : 1,
            transition: `opacity ${FADE_MS}ms ease`,
            pointerEvents: phase === 'fade' ? 'none' : 'auto',
          }}
        >
          <PageLoader minHeight="100vh" />
        </Box>
      )}
    </>
  );
};
