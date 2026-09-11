import { Box, Typography, Button } from '@mui/material';
import { InboxRounded } from '@mui/icons-material';
import type { ReactNode } from 'react';

/*
  Un vacío que contesta la pregunta igual. Cada variante dice por qué está
  vacío y qué hacer, con una ilustración de línea en el color terciario del
  tema, y deja un hueco (`extra`) para mostrar lo más cercano que haya en vez
  de disculparse: el próximo partido, los equipos inscritos, el banquillo.
*/

export type EmptyVariant = 'inbox' | 'live' | 'court' | 'search' | 'bench' | 'news' | 'table';

interface Props {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Botón principal relleno (por defecto) o de contorno, para cuando la acción es secundaria. */
  actionVariant?: 'contained' | 'outlined' | 'text';
  actionIcon?: ReactNode;
  /** Icono suelto, para la variante `inbox` del panel. */
  icon?: ReactNode;
  variant?: EmptyVariant;
  /** Lo que va entre el texto y la acción: el próximo partido, una tabla fantasma. */
  extra?: ReactNode;
  /** Menos aire: para bloques chicos dentro de una página con más contenido. */
  compact?: boolean;
  /** Solo `bench`: asientos totales y ocupados. */
  seats?: number;
  filled?: number;
}

const svgProps = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 } as const;

/** Cancha vista desde arriba, vacía. */
const CourtArt = () => (
  <svg viewBox="0 0 150 88" {...svgProps} aria-hidden>
    <rect x="8" y="6" width="134" height="76" rx="4" strokeDasharray="4 4" />
    <path d="M75 6v76" />
    <circle cx="75" cy="44" r="13" />
    <rect x="8" y="26" width="22" height="36" />
    <rect x="120" y="26" width="22" height="36" />
    <circle cx="75" cy="44" r="1.5" fill="currentColor" />
  </svg>
);

/** Lupa con un balón adentro. */
const SearchArt = () => (
  <svg viewBox="0 0 150 88" {...svgProps} aria-hidden>
    <circle cx="68" cy="40" r="26" />
    <path d="M87 59l22 22" strokeWidth="3" strokeLinecap="round" />
    <circle cx="68" cy="40" r="11" />
    <path d="M68 29v22M57.5 35l21 10M57.5 45l21-10" strokeWidth="1" />
  </svg>
);

/** Tres tarjetas fantasma con la silueta de una noticia. */
const NewsArt = () => (
  <svg viewBox="0 0 190 88" {...svgProps} aria-hidden>
    {[2, 67, 132].map((x) => (
      <g key={x}>
        <rect x={x} y="8" width="56" height="72" rx="6" strokeDasharray="4 4" />
        <rect x={x + 6} y="14" width="44" height="26" rx="3" />
        <rect x={x + 6} y="46" width="18" height="6" rx="3" />
        <path d={`M${x + 6} 60h44M${x + 6} 68h30`} />
      </g>
    ))}
  </svg>
);

/** Tabla con filas de guiones. */
const TableArt = () => (
  <svg viewBox="0 0 150 88" {...svgProps} aria-hidden>
    <rect x="8" y="6" width="134" height="76" rx="6" strokeDasharray="4 4" />
    <path d="M8 24h134" />
    {[38, 52, 66].map((y) => (
      <g key={y}>
        <circle cx="24" cy={y} r="4" />
        <path d={`M34 ${y}h44M104 ${y}h8M120 ${y}h8`} strokeLinecap="round" />
      </g>
    ))}
  </svg>
);

/** Marcador apagado: el fondo del vacío del vivo. */
const LiveBoard = () => (
  <Box
    sx={{
      bgcolor: '#0A0F1E',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 2.5,
      px: 2.25,
      py: 1.5,
      display: 'grid',
      gap: 0.5,
      justifyItems: 'center',
      color: '#6B7494',
    }}
  >
    <Typography
      component="span"
      className="tabular"
      sx={{
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontWeight: 800,
        fontSize: 30,
        lineHeight: 1,
        letterSpacing: '0.05em',
        color: '#3A4666',
        animation: 'pulse 2.4s ease-in-out infinite',
      }}
    >
      – : –
    </Typography>
    <Typography component="span" sx={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      Sin partidos en vivo
    </Typography>
  </Box>
);

/** Banquillo: un asiento punteado por cupo, rellenos los que ya están. */
const Bench: React.FC<{ seats: number; filled: number }> = ({ seats, filled }) => (
  <Box sx={{ display: 'flex', gap: 1 }} aria-hidden>
    {Array.from({ length: seats }).map((_, i) => {
      const on = i < filled;
      return (
        <Box
          key={i}
          sx={{
            width: 28,
            height: 34,
            borderRadius: '8px 8px 4px 4px',
            border: '1.5px',
            borderStyle: on ? 'solid' : 'dashed',
            borderColor: on ? 'primary.main' : 'text.disabled',
            bgcolor: on ? 'var(--primarySoft)' : 'transparent',
            opacity: on ? 1 : 0.7,
            animation: on ? 'llfRise 0.3s cubic-bezier(.2,.7,.2,1) both' : 'none',
            animationDelay: `${i * 50}ms`,
          }}
        />
      );
    })}
  </Box>
);

export const EmptyState: React.FC<Props> = ({
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'contained',
  actionIcon,
  icon,
  variant = 'inbox',
  extra,
  compact = false,
  seats = 5,
  filled = 0,
}) => {
  const art =
    variant === 'court' ? (
      <CourtArt />
    ) : variant === 'search' ? (
      <SearchArt />
    ) : variant === 'news' ? (
      <NewsArt />
    ) : variant === 'table' ? (
      <TableArt />
    ) : null;

  return (
    <Box
      sx={{
        textAlign: 'center',
        py: compact ? 3 : 6,
        px: 3,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 4,
        bgcolor: 'background.default',
        display: 'grid',
        justifyItems: 'center',
        gap: 1,
      }}
    >
      {variant === 'inbox' && (
        <Box
          sx={{
            width: 64,
            height: 64,
            mb: 1,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'primary.soft',
            color: 'primary.main',
          }}
        >
          {icon ?? <InboxRounded sx={{ fontSize: 32 }} />}
        </Box>
      )}
      {art && (
        <Box
          sx={{
            width: variant === 'news' ? 190 : 150,
            maxWidth: '100%',
            height: compact ? 64 : 88,
            color: 'text.disabled',
            mb: 0.5,
            '& svg': { width: '100%', height: '100%', display: 'block', overflow: 'visible' },
          }}
        >
          {art}
        </Box>
      )}
      {variant === 'live' && <LiveBoard />}
      {variant === 'bench' && <Bench seats={seats} filled={filled} />}

      <Typography variant="h4" sx={{ mt: 0.5, textWrap: 'balance' }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {extra && <Box sx={{ width: '100%', maxWidth: 400, mt: 1 }}>{extra}</Box>}
      {actionLabel && onAction && (
        <Button
          variant={actionVariant}
          onClick={onAction}
          endIcon={actionIcon}
          sx={{ mt: 1.5, ...(actionVariant !== 'contained' && { color: 'text.secondary' }) }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};
