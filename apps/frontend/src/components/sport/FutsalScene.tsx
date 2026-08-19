import { Box } from '@mui/material';

/**
 * Fondo decorativo del panel de marca: las líneas de una cancha de futsal
 * vistas en fuga, apenas insinuadas sobre el degradado. No hay objetos ni
 * animación a propósito: el protagonista es el texto que va encima.
 *
 * El trazado está a escala real de futsal (40 × 20 m) para que las marcas
 * caigan donde el ojo las espera: círculo central de 3 m, área de 6 m con sus
 * cuartos de círculo y los puntos de penal de 6 y 10 m.
 */

const LINE = 'rgba(255,255,255,0.22)';
const LINE_SOFT = 'rgba(255,255,255,0.14)';

const CourtMarkings: React.FC = () => (
  <svg viewBox="-60 -40 1120 580" width="100%" height="100%" preserveAspectRatio="none" aria-hidden>
    <g fill="none" stroke={LINE} strokeWidth="3" strokeLinecap="round">
      {/* Perímetro, línea de medio campo y círculo central */}
      <rect x="0" y="0" width="1000" height="500" />
      <line x1="500" y1="0" x2="500" y2="500" />
      <circle cx="500" cy="250" r="75" />

      {/* Áreas de 6 m: dos cuartos de círculo unidos por un tramo recto */}
      <path d="M0 62.5 A150 150 0 0 1 150 212.5 L150 287.5 A150 150 0 0 1 0 437.5" />
      <path d="M1000 62.5 A150 150 0 0 0 850 212.5 L850 287.5 A150 150 0 0 0 1000 437.5" />

      {/* Esquinas */}
      <path d="M0 16 A16 16 0 0 0 16 0" />
      <path d="M984 0 A16 16 0 0 0 1000 16" />
      <path d="M1000 484 A16 16 0 0 0 984 500" />
      <path d="M16 500 A16 16 0 0 0 0 484" />
    </g>

    {/* Punto central y penales de 6 y 10 m */}
    <g fill={LINE}>
      <circle cx="500" cy="250" r="5" />
      <circle cx="150" cy="250" r="5" />
      <circle cx="850" cy="250" r="5" />
      <circle cx="250" cy="250" r="4" />
      <circle cx="750" cy="250" r="4" />
    </g>

    {/* Arcos, insinuados por fuera de la línea de fondo */}
    <g fill="none" stroke={LINE_SOFT} strokeWidth="3">
      <rect x="-42" y="212.5" width="42" height="75" />
      <rect x="1000" y="212.5" width="42" height="75" />
    </g>
  </svg>
);

const FutsalScene: React.FC = () => (
  <Box aria-hidden sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    {/* Luz ambiental: claro arriba a la izquierda, profundidad abajo */}
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(120% 90% at 10% -10%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%),
          radial-gradient(90% 70% at 95% 10%, rgba(147,197,253,0.20) 0%, rgba(147,197,253,0) 60%),
          radial-gradient(100% 70% at 50% 115%, rgba(1,17,45,0.55) 0%, rgba(1,17,45,0) 65%)`,
      }}
    />

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
        opacity: 0.65,
        maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0) 88%)',
        WebkitMaskImage:
          'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0) 88%)',
      }}
    >
      <CourtMarkings />
    </Box>

    {/* Resplandor en el horizonte, donde la cancha se pierde */}
    <Box
      sx={{
        position: 'absolute',
        left: '-10%',
        right: '-10%',
        top: '24%',
        height: 200,
        background:
          'radial-gradient(60% 100% at 50% 100%, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 70%)',
      }}
    />
  </Box>
);

export default FutsalScene;
