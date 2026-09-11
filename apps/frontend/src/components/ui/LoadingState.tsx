import { Box, Card, Skeleton, Stack, Typography } from '@mui/material';

/*
  Esqueletos con la forma del dato que viene. Antes todos eran la misma pila
  de rectángulos del mismo alto, y el salto al contenido real era brusco: el
  ojo no sabía dónde iba a caer cada cosa. Estos ya tienen la silueta de la
  tabla, la tarjeta de partido o la fila de plantilla que los reemplaza, y el
  brillo (teñido del azul del sistema, en el tema) entra fila por fila.
*/

/** Desfase del brillo por fila: la carga se lee de arriba hacia abajo. */
const stagger = (i: number) => ({
  '& .MuiSkeleton-root::after': { animationDelay: `${Math.min(i, 8) * 90}ms` },
});

export const LoadingState: React.FC<{ rows?: number; height?: number }> = ({ rows = 4, height = 56 }) => (
  <Stack spacing={1.25}>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} variant="rounded" height={height} animation="wave" sx={stagger(i)} />
    ))}
  </Stack>
);

export const SkeletonCard: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Skeleton variant="text" width="40%" height={32} animation="wave" />
    <Skeleton variant="rounded" height={120} sx={{ mt: 2 }} animation="wave" />
  </Box>
);

/**
 * Tabla genérica del panel: cabecera hundida y filas con celdas de anchos
 * distintos, como una tabla real. `columns` es el número de columnas de la
 * tabla que va a aparecer, así el esqueleto ocupa el mismo ancho.
 */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 4 }) => {
  const widths = ['62%', '40%', '75%', '50%', '58%', '45%', '70%', '52%'];
  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', gap: 2, px: 1.5, py: 1.25, bgcolor: 'background.default' }}>
        {Array.from({ length: columns }).map((_, c) => (
          <Skeleton key={c} width={`${c === 0 ? 28 : 16}%`} height={10} animation="wave" />
        ))}
      </Box>
      {Array.from({ length: rows }).map((_, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            px: 1.5,
            height: 52,
            borderTop: '1px solid',
            borderColor: 'divider',
            ...stagger(i),
          }}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Box key={c} sx={{ width: `${c === 0 ? 28 : 16}%` }}>
              <Skeleton width={widths[(i + c) % widths.length]} height={12} animation="wave" />
            </Box>
          ))}
        </Box>
      ))}
    </Card>
  );
};

/** Tabla de posiciones: posición · escudo · equipo · cuatro números a la derecha. */
export const StandingsSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => (
  <Card sx={{ overflow: 'hidden' }}>
    <Box sx={{ display: 'flex', gap: 1.5, px: 1.5, py: 1.25, bgcolor: 'background.default' }}>
      <Skeleton width={14} height={10} animation="wave" />
      <Skeleton width="30%" height={10} animation="wave" />
      <Box sx={{ flex: 1 }} />
      {[0, 1, 2, 3].map((k) => (
        <Skeleton key={k} width={22} height={10} animation="wave" />
      ))}
    </Box>
    {Array.from({ length: rows }).map((_, i) => (
      <Box
        key={i}
        sx={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'center',
          px: 1.5,
          height: 52,
          borderTop: '1px solid',
          borderColor: 'divider',
          ...stagger(i),
        }}
      >
        <Skeleton width={14} height={12} animation="wave" />
        <Skeleton variant="rounded" width={28} height={28} animation="wave" />
        <Skeleton width={`${34 + ((i * 17) % 28)}%`} height={12} animation="wave" />
        <Box sx={{ flex: 1 }} />
        {[0, 1, 2, 3].map((k) => (
          <Skeleton key={k} width={22} height={12} animation="wave" />
        ))}
      </Box>
    ))}
  </Card>
);

/**
 * Tarjeta de partido: dos escudos con nombre debajo y, en el medio, el bloque
 * del marcador o la hora. Es la silueta de `MatchCard` en su forma normal.
 */
export const MatchCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <Stack spacing={1.5}>
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} sx={{ p: 2, ...stagger(i) }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Skeleton width="38%" height={10} animation="wave" />
          <Skeleton width={56} height={18} animation="wave" sx={{ borderRadius: 999 }} />
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Stack alignItems="center" spacing={0.75} sx={{ flex: 1 }}>
            <Skeleton variant="circular" width={44} height={44} animation="wave" />
            <Skeleton width="60%" height={12} animation="wave" />
          </Stack>
          <Skeleton width={72} height={36} animation="wave" sx={{ borderRadius: 2 }} />
          <Stack alignItems="center" spacing={0.75} sx={{ flex: 1 }}>
            <Skeleton variant="circular" width={44} height={44} animation="wave" />
            <Skeleton width="60%" height={12} animation="wave" />
          </Stack>
        </Stack>
      </Card>
    ))}
  </Stack>
);

/** Fila de plantilla o de persona: foto redonda, nombre y un dato secundario. */
export const RosterSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <Stack spacing={0}>
    {Array.from({ length: rows }).map((_, i) => (
      <Stack
        key={i}
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'divider', ...stagger(i) }}
      >
        <Skeleton variant="circular" width={36} height={36} animation="wave" />
        <Box sx={{ flex: 1 }}>
          <Skeleton width={`${40 + ((i * 13) % 30)}%`} height={12} animation="wave" />
          <Skeleton width="24%" height={10} animation="wave" sx={{ mt: 0.75 }} />
        </Box>
        <Skeleton width={48} height={20} animation="wave" sx={{ borderRadius: 999 }} />
      </Stack>
    ))}
  </Stack>
);

/** Tarjeta de noticia: portada, chip de tipo y dos líneas de título. */
export const NewsCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} sx={{ overflow: 'hidden', ...stagger(i) }}>
        <Skeleton variant="rectangular" height={140} animation="wave" />
        <Box sx={{ p: 2 }}>
          <Skeleton width={64} height={20} animation="wave" sx={{ borderRadius: 999, mb: 1 }} />
          <Skeleton width="90%" height={14} animation="wave" />
          <Skeleton width="65%" height={14} animation="wave" sx={{ mt: 0.75 }} />
        </Box>
      </Card>
    ))}
  </Box>
);

/**
 * Tres puntos naranja para "cargando más" o "buscando": va en línea, al pie de
 * una lista o al lado de un botón, y no tapa nada.
 */
export const LoadingDots: React.FC<{ label?: string; size?: number; color?: string }> = ({
  label,
  size = 6,
  color = 'text.secondary',
}) => (
  <Stack direction="row" alignItems="center" spacing={1.25} sx={{ color }} role="status" aria-live="polite">
    <Stack direction="row" spacing={0.5} aria-hidden>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: size,
            height: size,
            borderRadius: '50%',
            bgcolor: 'var(--accent)',
            animation: 'llfDot 1s ease-in-out infinite',
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
    </Stack>
    {label && (
      <Typography variant="body2" component="span" sx={{ font: 'inherit' }}>
        {label}
      </Typography>
    )}
  </Stack>
);
