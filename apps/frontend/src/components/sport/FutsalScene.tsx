import { Box } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Escenografía decorativa 3D con motivos de futsal (cancha en perspectiva,
 * balón flotando, arco al fondo). Puramente visual: no captura eventos.
 */

const polygonPoints = (cx: number, cy: number, r: number, rotationDeg: number, sides = 5) =>
  Array.from({ length: sides }, (_, i) => {
    const a = ((rotationDeg + i * (360 / sides)) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');

const PENTAGON_ANGLES = [-90, -18, 54, 126, 198];

const Ball: React.FC<{ id?: string }> = ({ id = 'ball' }) => (
  <svg viewBox="0 0 220 220" width="100%" height="100%" aria-hidden>
    <defs>
      <radialGradient id={`${id}-body`} cx="34%" cy="26%" r="80%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="42%" stopColor="#EDF2FB" />
        <stop offset="80%" stopColor="#B7C6E3" />
        <stop offset="100%" stopColor="#768CB4" />
      </radialGradient>
      <radialGradient id={`${id}-shade`} cx="34%" cy="26%" r="84%">
        <stop offset="55%" stopColor="rgba(2,22,56,0)" />
        <stop offset="100%" stopColor="rgba(2,22,56,0.55)" />
      </radialGradient>
      <radialGradient id={`${id}-spec`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </radialGradient>
      <linearGradient id={`${id}-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(96,165,250,0)" />
        <stop offset="100%" stopColor="rgba(147,197,253,0.85)" />
      </linearGradient>
      <clipPath id={`${id}-clip`}>
        <circle cx="110" cy="110" r="100" />
      </clipPath>
    </defs>

    <circle cx="110" cy="110" r="100" fill={`url(#${id}-body)`} />

    <g clipPath={`url(#${id}-clip)`}>
      {/* Costuras hacia los paneles del borde */}
      {PENTAGON_ANGLES.map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          <line
            key={`seam-${a}`}
            x1={110 + 36 * Math.cos(rad)}
            y1={104 + 36 * Math.sin(rad)}
            x2={110 + 104 * Math.cos(rad)}
            y2={104 + 104 * Math.sin(rad)}
            stroke="rgba(6,42,94,0.32)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        );
      })}
      {/* Pentágono central */}
      <polygon points={polygonPoints(110, 104, 37, -90)} fill="#062A5E" />
      {/* Pentágonos del borde (recortados por la esfera) */}
      {PENTAGON_ANGLES.map((a) => {
        const rad = ((a + 36) * Math.PI) / 180;
        return (
          <polygon
            key={`panel-${a}`}
            points={polygonPoints(110 + 96 * Math.cos(rad), 104 + 96 * Math.sin(rad), 32, a + 36 + 180)}
            fill="#062A5E"
            opacity="0.92"
          />
        );
      })}
    </g>

    {/* Volumen y luces */}
    <circle cx="110" cy="110" r="100" fill={`url(#${id}-shade)`} />
    <circle cx="110" cy="110" r="99" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="3" />
    <ellipse cx="76" cy="62" rx="30" ry="20" fill={`url(#${id}-spec)`} transform="rotate(-28 76 62)" />
  </svg>
);

const FutsalScene: React.FC = () => {
  const reduce = useReducedMotion();
  const float = reduce
    ? {}
    : {
        animate: { y: [-14, 10, -14] },
        transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const },
      };

  return (
    <Box aria-hidden sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Luz ambiental + profundidad */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(120% 80% at 12% 0%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0) 60%),
            radial-gradient(90% 70% at 100% 15%, rgba(96,165,250,0.35) 0%, rgba(96,165,250,0) 65%),
            radial-gradient(80% 60% at 50% 110%, rgba(1,17,45,0.65) 0%, rgba(1,17,45,0) 70%)`,
        }}
      />

      {/* Destello cálido de marca */}
      <Box
        component={motion.div}
        initial={{ opacity: 0.35 }}
        animate={reduce ? undefined : { opacity: [0.28, 0.5, 0.28] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          top: '6%',
          right: '-8%',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,138,76,0.40) 0%, rgba(255,138,76,0) 70%)',
          filter: 'blur(10px)',
        }}
      />

      {/* Arco al fondo */}
      <Box
        sx={{
          position: 'absolute',
          left: '57%',
          top: '26%',
          width: 300,
          height: 150,
          transform: 'translateX(-50%)',
          opacity: 0.32,
        }}
      >
        <svg viewBox="0 0 260 130" width="100%" height="100%" aria-hidden>
          <defs>
            <linearGradient id="futsal-net-fade" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </linearGradient>
          </defs>
          {/* Red en perspectiva */}
          <g stroke="url(#futsal-net-fade)" strokeWidth="1">
            {Array.from({ length: 13 }, (_, i) => 20 + i * 18).map((x) => (
              <line key={`v${x}`} x1={x} y1="18" x2={38 + (x - 20) * 0.77} y2="112" />
            ))}
            {Array.from({ length: 6 }, (_, i) => 18 + i * 19).map((y) => {
              const t = (y - 18) / 94;
              const inset = 18 * t;
              return <line key={`h${y}`} x1={20 + inset} y1={y} x2={240 - inset} y2={y} />;
            })}
          </g>
          {/* Marco */}
          <path
            d="M14 118 L14 14 L246 14 L246 118"
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Box>

      {/* Cancha 3D en perspectiva */}
      <Box
        sx={{
          position: 'absolute',
          left: '-40%',
          right: '-40%',
          bottom: '-14%',
          height: '78%',
          transformOrigin: 'bottom center',
          transform: 'perspective(760px) rotateX(66deg)',
          backgroundImage: `
            repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 2px, rgba(255,255,255,0) 2px 96px),
            repeating-linear-gradient(0deg, rgba(255,255,255,0.11) 0 2px, rgba(255,255,255,0) 2px 96px)`,
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0) 82%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0) 82%)',
        }}
      >
        {/* Círculo central, línea de medio campo y punto central */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '52%',
            width: '24%',
            aspectRatio: '1',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.22)',
          }}
        />
        <Box
          sx={{ position: 'absolute', left: 0, right: 0, top: '52%', height: '2px', bgcolor: 'rgba(255,255,255,0.18)' }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '52%',
            width: 10,
            height: 10,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.5)',
          }}
        />
      </Box>

      {/* Balón principal + sombra proyectada */}
      <Box sx={{ position: 'absolute', right: '9%', top: '44%', width: { md: 180, lg: 230 }, aspectRatio: '1' }}>
        <Box
          component={motion.div}
          animate={reduce ? undefined : { scaleX: [1, 0.86, 1], opacity: [0.45, 0.28, 0.45] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: '-24%',
            width: '86%',
            height: '18%',
            transform: 'translateX(-50%)',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(1,17,45,0.85) 0%, rgba(1,17,45,0) 70%)',
            filter: 'blur(6px)',
          }}
        />
        <Box
          component={motion.div}
          {...float}
          sx={{ width: '100%', height: '100%', filter: 'drop-shadow(0 28px 40px rgba(1,17,45,0.45))' }}
        >
          <Ball id="ball-main" />
        </Box>
      </Box>

      {/* Balones secundarios (profundidad de campo) */}
      <Box
        component={motion.div}
        animate={reduce ? undefined : { y: [-8, 8, -8] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        sx={{ position: 'absolute', right: '30%', top: '10%', width: 64, height: 64, opacity: 0.5, filter: 'blur(1.5px)' }}
      >
        <Ball id="ball-far" />
      </Box>
      <Box
        component={motion.div}
        animate={reduce ? undefined : { y: [6, -6, 6] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        sx={{ position: 'absolute', right: '5%', bottom: '10%', width: 42, height: 42, opacity: 0.3, filter: 'blur(2.5px)' }}
      >
        <Ball id="ball-far2" />
      </Box>

      {/* Textura sutil */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.07,
          mixBlendMode: 'overlay',
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </Box>
  );
};

export default FutsalScene;
