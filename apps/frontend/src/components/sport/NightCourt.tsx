import { Box } from '@mui/material';
import { CourtMarkings } from './FutsalScene';

/**
 * La cancha de noche, literal: el trazado en fuga sobre el navy del lienzo y
 * tres reflectores que respiran desde el borde superior. Es la misma escena
 * que el loader de partidos, a pantalla completa, para la puerta de entrada.
 */
export const NightCourt: React.FC = () => (
  <Box aria-hidden sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    {/*
      Cancha en fuga. Sube hasta media pantalla y las líneas van al doble de
      intensidad que en el panel de marca: acá la cancha es el escenario, no
      una marca de agua, y tiene que leerse alrededor de la tarjeta.
    */}
    <Box
      sx={{
        position: 'absolute',
        left: '-25%',
        right: '-25%',
        bottom: '2%',
        height: '82%',
        transformOrigin: 'bottom center',
        transform: 'perspective(1100px) rotateX(58deg)',
        opacity: 0.85,
        maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 55%, rgba(0,0,0,0) 100%)',
        WebkitMaskImage:
          'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 55%, rgba(0,0,0,0) 100%)',
      }}
    >
      <CourtMarkings line="rgba(255,255,255,0.42)" lineSoft="rgba(255,255,255,0.26)" />
    </Box>

    {/* Tres reflectores: repartidos a 1/6, 1/2 y 5/6 del ancho, cada uno con su fase. */}
    {[
      { left: '-1%', delay: '0s' },
      { left: '33%', delay: '2s' },
      { left: '67%', delay: '4s' },
    ].map((l) => (
      <Box
        key={l.left}
        sx={{
          position: 'absolute',
          top: 0,
          left: l.left,
          width: '34%',
          height: '70%',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,138,76,0.32), rgba(255,138,76,0) 70%)',
          animation: 'llfLampBreathe 6s ease-in-out infinite',
          animationDelay: l.delay,
          '&::before': {
            content: '""',
            position: 'absolute',
            left: '50%',
            top: 0,
            width: 12,
            height: 5,
            ml: '-6px',
            borderRadius: '0 0 6px 6px',
            bgcolor: '#FF8A4C',
            boxShadow: '0 0 14px 2px rgba(255,138,76,0.8)',
          },
        }}
      />
    ))}
  </Box>
);
