import { Box, Button, Chip, Container, Stack, Typography, useTheme } from '@mui/material';
import ConstructionRounded from '@mui/icons-material/ConstructionRounded';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import type { ReactNode } from 'react';

/*
  Pantalla de "próximamente" para las secciones que todavía no están listas.
  Una escena de obra: futbolistas con casco armando un marcador ladrillo por
  ladrillo. Es SVG y animación CSS (keyframes `llf*` en el tema), sin imágenes.

  Dos reglas que no se ven pero importan:
  - Una animación CSS pisa el atributo `transform` del mismo elemento. Por eso
    toda pieza animada es un <g> propio, sin `transform` de atributo: la
    posición va en un <g> de afuera y el movimiento en el de adentro.
  - Con movimiento reducido los ladrillos se quedan puestos; si no, la regla
    global del tema los dejaría en el último fotograma, que es invisible.
*/

type Pose = 'hammer' | 'carry' | 'juggle';

const HAT = '#ffc21a';
const BRICK = '#c4622d';
const INK = '#171a24';
/** Origen de rotación en el punto de anclaje del <g> (hombro, cadera). */
const AT_ORIGIN = { transformBox: 'view-box', transformOrigin: '0 0' } as const;

interface FootballerProps {
  pose: Pose;
  jersey: string;
  shorts: string;
  skin: string;
  number?: string;
}

/** Futbolista de perfil, de cara a la derecha, con los pies en (0, 0). */
const Footballer: React.FC<FootballerProps> = ({ pose, jersey, shorts, skin, number }) => {
  const leg = (cx: number, cls: string) => (
    <g className={cls}>
      <rect x={cx - 4} y={-46} width={8} height={40} rx={4} fill={skin} />
      <rect x={cx - 4} y={-26} width={8} height={20} fill={jersey} />
      <ellipse cx={cx + 2} cy={-3} rx={7} ry={4.5} fill={INK} />
    </g>
  );

  const sleeve = (
    <>
      <rect x={-3.5} y={-2} width={7} height={13} rx={3.5} fill={jersey} />
      <rect x={-3} y={9} width={6} height={17} rx={3} fill={skin} />
    </>
  );

  const arm = (x: number, rot: number, inner: ReactNode, cls = '') => (
    <g transform={`translate(${x} -92) rotate(${rot})`}>
      <g className={cls} style={AT_ORIGIN}>
        {inner}
      </g>
    </g>
  );

  const legCls = {
    hammer: ['', ''],
    carry: ['cs-step rev', 'cs-step'],
    juggle: ['', 'cs-kick'],
  }[pose];

  return (
    <g>
      <ellipse cx={0} cy={1} rx={19} ry={4} fill="rgba(0,0,0,0.22)" />

      {/* Brazo de atrás, detrás del torso. */}
      {pose === 'hammer' && arm(-12, 8, sleeve)}
      {pose === 'carry' && arm(-12, 10, sleeve)}
      {pose === 'juggle' && arm(-12, 28, sleeve)}

      {leg(-6, legCls[0])}

      <rect x={-13} y={-58} width={26} height={16} rx={4} fill={shorts} />
      <rect x={-15} y={-98} width={30} height={44} rx={9} fill={jersey} />
      {number && (
        <text x={0} y={-70} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff" fontFamily="Inter, sans-serif">
          {number}
        </text>
      )}

      {leg(6, legCls[1])}

      {/* Cabeza con casco de obra. */}
      <circle cx={0} cy={-112} r={11} fill={skin} />
      <circle cx={4.5} cy={-111} r={1.4} fill={INK} />
      <path d="M-13 -114 a13 13 0 0 1 26 0 z" fill={HAT} />
      <rect x={-15} y={-116} width={32} height={4} rx={2} fill="#e0a300" />

      {/* Brazo de adelante: lo que hace cada uno. */}
      {pose === 'hammer' &&
        arm(
          12,
          -80,
          <>
            {sleeve}
            <rect x={-1.5} y={24} width={3} height={22} rx={1.5} fill="#8a5a2b" />
            <rect x={-8} y={42} width={16} height={8} rx={2} fill="#8a93a6" />
          </>,
          'cs-hammer',
        )}
      {pose === 'carry' &&
        arm(
          12,
          -160,
          <>
            {sleeve}
            <rect x={-9} y={24} width={18} height={10} rx={1.5} fill={BRICK} stroke="#8f4520" strokeWidth={1} />
          </>,
        )}
      {pose === 'juggle' && arm(12, -28, sleeve)}

      {pose === 'juggle' && (
        <g transform="translate(22 -12)">
          <g className="cs-juggle">
            <g className="cs-ballspin">
              <circle r={9} fill="#fff" stroke={INK} strokeWidth={1.5} />
              <path d="M0 -4 L4 -1 L2.5 3.5 H-2.5 L-4 -1 Z" fill={INK} />
            </g>
          </g>
        </g>
      )}
    </g>
  );
};

/** Ladrillos del marcador: 4 filas, las impares corridas medio ladrillo. */
const BOARD = { x: 210, y: 74, w: 220, h: 80 };
const BRICKS = Array.from({ length: 4 }, (_, row) =>
  Array.from({ length: row % 2 ? 6 : 5 }, (_, col) => ({
    row,
    col,
    x: BOARD.x + (row % 2 ? -22 : 0) + col * 44,
    y: BOARD.y + row * 20,
  })),
).flat();

const Scene: React.FC<{ title: string }> = ({ title }) => {
  const theme = useTheme();
  const label = title.toUpperCase();
  return (
    <svg
      viewBox="0 0 640 330"
      role="img"
      aria-label={`Futbolistas con casco construyendo la sección ${title}`}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      {/* Cancha */}
      <rect y={246} width={640} height={84} fill="#2e8b4f" />
      {[0, 2, 4, 6].map((i) => (
        <rect key={i} x={i * 80} y={246} width={80} height={84} fill="#287d46" />
      ))}
      <path d="M250 330 A70 70 0 0 1 390 330" fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />
      <line x1={0} y1={319} x2={640} y2={319} stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />

      {/* Estructura del marcador */}
      <line x1={210} y1={166} x2={430} y2={250} stroke="#3b475f" strokeOpacity={0.4} strokeWidth={3} />
      <line x1={430} y1={166} x2={210} y2={250} stroke="#3b475f" strokeOpacity={0.4} strokeWidth={3} />
      <rect x={200} y={210} width={240} height={7} fill="#b98a4b" />
      <rect x={200} y={64} width={10} height={186} fill="#3b475f" />
      <rect x={430} y={64} width={10} height={186} fill="#3b475f" />

      <rect x={200} y={64} width={240} height={100} rx={8} fill="#0b1a33" stroke="#3b475f" strokeWidth={4} />
      <clipPath id="llf-cs-board">
        <rect x={BOARD.x} y={BOARD.y} width={BOARD.w} height={BOARD.h} />
      </clipPath>
      <g clipPath="url(#llf-cs-board)">
        {BRICKS.map((b, i) => (
          <rect
            key={i}
            className="cs-brick"
            x={b.x}
            y={b.y}
            width={42}
            height={18}
            rx={2}
            fill={(b.row + b.col) % 2 ? theme.palette.primary.main : theme.palette.primary.light}
            style={{ animationDelay: `${i * 0.38}s` }}
          />
        ))}
      </g>
      <text
        x={320}
        y={label.length > 8 ? 117 : 123}
        textAnchor="middle"
        fontSize={label.length > 8 ? 22 : 30}
        fontWeight={800}
        letterSpacing={2}
        fill="#fff"
        stroke="#0b1a33"
        strokeWidth={5}
        paintOrder="stroke"
        fontFamily="'Plus Jakarta Sans', sans-serif"
      >
        {label}
      </text>

      {/* Grúa: sube ladrillos hasta el marcador. */}
      <rect x={430} y={58} width={64} height={6} fill="#3b475f" />
      <line x1={486} y1={64} x2={486} y2={250} stroke="#6b7280" strokeWidth={1.5} />
      <g transform="translate(486 232)">
        <g className="cs-hoist">
          <line x1={0} y1={-6} x2={0} y2={0} stroke="#6b7280" strokeWidth={2} />
          <rect x={-9} y={0} width={18} height={10} rx={1.5} fill={BRICK} stroke="#8f4520" strokeWidth={1} />
        </g>
      </g>

      {/* Conos */}
      {[66, 612].map((x) => (
        <g key={x} transform={`translate(${x} 252)`}>
          <path d="M-9 0 L9 0 L4 -34 L-4 -34 Z" fill="#ff7a1a" />
          <rect x={-5.5} y={-22} width={11} height={5} fill="#fff" />
          <rect x={-11} y={-2} width={22} height={4} rx={2} fill="#d95f0a" />
        </g>
      ))}

      {/* Los tres: martillo, ladrillo y jueguitos. */}
      <g transform="translate(152 270)">
        <g className="cs-bob">
          <Footballer pose="hammer" jersey="#034292" shorts="#10203f" skin="#f2c29b" number="9" />
        </g>
      </g>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${194 + i * 3.5} ${204 + i * 3})`}>
          <g className="cs-spark" style={{ animationDelay: `${i * 0.03}s` }}>
            <path d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z" fill="#ffd34d" />
          </g>
        </g>
      ))}

      <g transform="translate(540 262)">
        <g className="cs-pace">
          <g className="cs-bob">
            <Footballer pose="carry" jersey="#ff7a1a" shorts="#10203f" skin="#c68642" />
          </g>
        </g>
      </g>

      <g transform="translate(318 288) scale(1.08)">
        <Footballer pose="juggle" jersey="#e63946" shorts="#fff" skin="#8d5524" number="10" />
      </g>
    </svg>
  );
};

interface Props {
  title: string;
  description: string;
  onBack: () => void;
  /** Un segundo destino, para que el visitante no se quede sin nada que hacer. */
  secondary?: { label: string; onClick: () => void };
}

export const ComingSoon: React.FC<Props> = ({ title, description, onBack, secondary }) => (
  <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
    <Stack alignItems="center" spacing={{ xs: 2.5, md: 3 }} sx={{ textAlign: 'center' }}>
      <Chip
        icon={<ConstructionRounded />}
        label="Próximamente"
        color="warning"
        sx={{ fontWeight: 800, letterSpacing: 0.2 }}
      />

      <Box>
        <Typography component="h1" variant="h2" sx={{ mb: 1, textWrap: 'balance' }}>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 480, mx: 'auto', textWrap: 'balance' }}>
          {description}
        </Typography>
      </Box>

      <Box
        sx={{
          width: '100%',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          '& .cs-hammer': { animation: 'llfHammer 0.9s ease-in infinite' },
          '& .cs-spark': {
            animation: 'llfSpark 0.9s ease-out infinite',
            transformBox: 'fill-box',
            transformOrigin: 'center',
            opacity: 0,
          },
          '& .cs-step': {
            animation: 'llfStep 0.7s ease-in-out infinite',
            transformBox: 'fill-box',
            transformOrigin: '50% 0%',
          },
          '& .cs-step.rev': { animationDirection: 'reverse' },
          '& .cs-pace': { animation: 'llfPace 8s linear infinite' },
          '& .cs-bob': { animation: 'llfBob 0.7s ease-in-out infinite' },
          '& .cs-brick': { animation: 'llfBrickIn 10s both infinite' },
          '& .cs-hoist': { animation: 'llfHoist 6s ease-in-out infinite' },
          '& .cs-juggle': { animation: 'llfJuggle 1.1s infinite' },
          '& .cs-ballspin': {
            animation: 'llfSpin 1.1s linear infinite',
            transformBox: 'fill-box',
            transformOrigin: 'center',
          },
          '& .cs-kick': {
            animation: 'llfKick 1.1s ease-in-out infinite',
            transformBox: 'fill-box',
            transformOrigin: '50% 0%',
          },
          '@media (prefers-reduced-motion: reduce)': {
            '& .cs-brick': { animation: 'none', opacity: 1 },
            '& .cs-spark': { animation: 'none', opacity: 0 },
          },
        }}
      >
        {/* Cinta de obra: las franjas avanzan. */}
        <Box
          aria-hidden
          sx={{
            height: 12,
            background: 'repeating-linear-gradient(45deg, #ffc21a 0 10px, #1b1f2a 10px 20px)',
            animation: 'llfHazard 1.2s linear infinite',
          }}
        />
        <Scene title={title} />
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
        <Button variant="contained" startIcon={<ArrowBackRounded />} onClick={onBack} sx={{ minHeight: 44 }}>
          Volver al inicio
        </Button>
        {secondary && (
          <Button variant="outlined" onClick={secondary.onClick} sx={{ minHeight: 44 }}>
            {secondary.label}
          </Button>
        )}
      </Stack>
    </Stack>
  </Container>
);
