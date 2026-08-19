import { Box, Card, Fade, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { usePublicAdsQuery } from '@/hooks/queries';
import { getPlacementMeta, type AdVariant } from '@/utils/adPlacements';
import type { Ad, AdPlacement } from '@/api/ads.api';

interface Props {
  placement: AdPlacement;
  /** Por defecto, la forma que define el catálogo de ubicaciones. */
  variant?: AdVariant;
  /** Rótulo del panel. `null` lo saca. */
  label?: string | null;
  /** Tope de piezas a mostrar en las ranuras que apilan (lateral y logos). */
  max?: number;
  /** Para la ranura que cae arriba del pliegue: se carga con prioridad. */
  priority?: boolean;
  /**
   * Fuerza el panel en blanco con borde, independiente del tema. Es para las
   * ranuras que caen sobre una superficie oscura, como el pie de página: ahí la
   * tarjeta del tema se confunde con el fondo.
   */
  onDark?: boolean;
  sx?: object;
}

/** Cada cuánto rota una ranura que tiene más de un anuncio cargado. */
const ROTATE_MS = 8000;

/** La imagen, envuelta en su enlace solo si el anuncio tiene destino. */
const AdImage: React.FC<{ ad: Ad; sx?: object; priority?: boolean }> = ({ ad, sx, priority }) => {
  const img = (
    <Box
      component="img"
      src={ad.imageUrl}
      alt={ad.title || 'Publicidad'}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      sx={{ display: 'block', width: '100%', height: 'auto', ...sx }}
    />
  );
  if (!ad.linkUrl) return img;
  return (
    <Box
      component="a"
      href={ad.linkUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      sx={{ display: 'block', lineHeight: 0 }}
    >
      {img}
    </Box>
  );
};

/**
 * Una ranura publicitaria del sitio público.
 *
 * Se pide sola los anuncios de su ubicación y, si no hay ninguno vigente, no
 * deja hueco: devuelve null. Cuando hay varios, los va rotando en el mismo
 * espacio en lugar de apilarlos, salvo en las ranuras que existen justamente
 * para mostrar varios juntos (la columna lateral y la tira de logos del pie).
 */
export const AdSlot: React.FC<Props> = ({ placement, variant, label, max, priority, onDark, sx }) => {
  const { data: ads = [] } = usePublicAdsQuery(placement);
  const meta = getPlacementMeta(placement);
  const shape = variant ?? meta?.variant ?? 'panel';
  /*
    Caja de medida fija por ubicación: la imagen se recorta para llenarla en vez
    de dejar el panel a medio pintar. Todas las piezas de una misma ranura miden
    igual, suba lo que suba el administrador.
  */
  const box = meta?.ratio
    ? { aspectRatio: meta.ratio, height: '100%', objectFit: 'cover' as const }
    : {};
  const stacked = shape === 'logos' || shape === 'sidebar';
  const list = max ? ads.slice(0, max) : ads;

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (stacked || list.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % list.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [stacked, list.length]);

  if (list.length === 0) return null;

  // Si se borra un anuncio mientras alguien mira la página, el índice queda fuera de rango.
  const current = list[index % list.length];

  if (shape === 'logos') {
    return (
      <Stack
        direction="row"
        useFlexGap
        sx={{
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          columnGap: { xs: 2.5, md: 4 },
          rowGap: 2,
          ...sx,
        }}
      >
        {list.map((ad) => (
          <AdImage
            key={ad.id}
            ad={ad}
            // Todos al mismo alto y respetando su proporción: es una tira de logos,
            // no un collage de imágenes de tamaños distintos.
            sx={{
              width: 'auto',
              height: { xs: 26, md: 32 },
              maxWidth: 150,
              objectFit: 'contain',
              opacity: 0.85,
              transition: 'opacity 0.2s ease',
              '&:hover': { opacity: 1 },
            }}
          />
        ))}
      </Stack>
    );
  }

  if (shape === 'sidebar') {
    return (
      <Stack spacing={2} sx={sx}>
        {list.map((ad) => (
          <Card key={ad.id} sx={{ overflow: 'hidden' }}>
            <AdImage ad={ad} sx={box} />
          </Card>
        ))}
      </Stack>
    );
  }

  /*
    La pieza se dibuja con la proporción real del archivo: forzarle una caja fija
    dejaba la mitad del panel en blanco alrededor de una imagen chica.
  */
  const rotating = (
    <Fade in key={current.id} timeout={400}>
      <Box>
        <AdImage
          ad={current}
          priority={priority}
          sx={{ borderRadius: shape === 'bare' ? 2 : 1.5, maxHeight: 220, ...box }}
        />
      </Box>
    </Fade>
  );

  if (shape === 'bare') return <Box sx={sx}>{rotating}</Box>;

  return (
    <Card
      sx={{
        p: { xs: 0.75, md: 1 },
        ...(onDark ? { bgcolor: '#FFFFFF', border: '1px solid #E6E9F2' } : {}),
        ...sx,
      }}
    >
      {label !== null && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mb: 0.5,
            ml: 0.5,
            color: onDark ? '#6B7494' : 'text.secondary',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {label ?? 'Publicidad'}
        </Typography>
      )}
      {rotating}
    </Card>
  );
};
