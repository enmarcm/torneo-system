import { Box } from '@mui/material';
import { CourtMarkings } from './FutsalScene';

/**
 * La cancha de noche, literal: el trazado en fuga sobre el navy del lienzo y
 * tres reflectores que respiran desde el borde superior. Es la misma escena
 * que el loader de partidos, a pantalla completa, para la puerta de entrada.
 */
export const NightCourt: React.FC = () => (
  <Box aria-hidden sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    {/* Cancha en fuga */}
    <Box
      sx={{
        position: 'absolute',
        left: '-30%',
        right: '-30%',
        bottom: '-8%',
        height: '72%',
        transformOrigin: 'bottom center',
        transform: 'perspective(1000px) rotateX(66deg)',
        opacity: 0.5,
        maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0) 88%)',
        WebkitMaskImage:
          'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0) 88%)',
      }}
    >
      <CourtMarkings />
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
