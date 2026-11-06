import { Box, Card, Fade, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { LogoMarquee } from './LogoMarquee';
import { usePublicAdsQuery } from '@/hooks/queries';
import { getPlacementMeta, type AdVariant } from '@/utils/adPlacements';
import type { Ad, AdPlacement } from '@/api/ads.api';

interface Props {
  placement: AdPlacement;
  /** Por defecto, la forma que define el catálogo de ubicaciones. */
  variant?: AdVariant;
  /** Rótulo del panel. Por defecto no se muestra ninguno. */
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

/** A partir de cuántos logos la tira del pie pasa a desplazarse como carrusel. */
const LOGOS_PARA_CARRUSEL = 4;

/*
  Los logos suben en el lienzo único de 5:1 con fondo transparente, así que el
  logo ocupa solo el centro. Por eso la pieza se muestra a un alto grande y se
  escala entera (sin deformarla): a 32px de alto el logo quedaba diminuto.
*/
const ALTO_LOGO = { xs: 44, md: 60 };
const SEPARACION_LOGOS = { xs: 1, md: 2 };

/** La imagen, envuelta en su enlace solo si el anuncio tiene destino. */
const AdImage: React.FC<{ ad: Ad; sx?: object; priority?: boolean; decorative?: boolean }> = ({
  ad,
  sx,
  priority,
  decorative,
}) => {
  const img = (
    <Box
      component="img"
      src={ad.imageUrl}
      // La copia del carrusel repite el logo: no se dicta dos veces ni se enfoca.
      alt={decorative ? '' : ad.title || 'Publicidad'}
      aria-hidden={decorative || undefined}
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
      tabIndex={decorative ? -1 : undefined}
      aria-hidden={decorative || undefined}
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
  const reduceMotion = useReducedMotion();

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
    // Todos al mismo alto y respetando su proporción: es una tira de logos,
    // no un collage de imágenes de tamaños distintos.
    const logo = {
      width: 'auto',
      height: ALTO_LOGO,
      flexShrink: 0,
      objectFit: 'contain' as const,
      transition: 'opacity 0.2s ease',
    };

    // Con varios logos la tira se desplaza como la de escudos de la portada.
    if (list.length >= LOGOS_PARA_CARRUSEL && !reduceMotion) {
      return (
        <LogoMarquee
          ariaLabel="Patrocinadores"
          srcs={list.map((ad) => ad.imageUrl)}
          renderItem={(n, copia) => (
            <AdImage
              key={`${list[n].id}-${copia ? 'c' : 'o'}`}
              ad={list[n]}
              decorative={copia}
              sx={logo}
            />
          )}
          sx={sx}
        />
      );
    }

    return (
      <Stack
        direction="row"
        useFlexGap
        sx={{
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          columnGap: SEPARACION_LOGOS,
          rowGap: 1,
          ...sx,
        }}
      >
        {list.map((ad) => (
          <AdImage key={ad.id} ad={ad} sx={logo} />
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
    Todas las ranuras piden el mismo lienzo 2:1, así que la caja de la ubicación
    y el archivo coinciden y la pieza entra entera, sin recorte ni relleno. El
    tope de alto de antes existía para las ranuras chatas; con una proporción
    única recortaba justo lo que se acaba de estandarizar.
  */
  const rotating = (
    <Fade in key={current.id} timeout={400}>
      <Box>
        <AdImage
          ad={current}
          priority={priority}
          sx={{ borderRadius: shape === 'bare' ? 2 : 1.5, ...(meta?.ratio ? {} : { maxHeight: 220 }), ...box }}
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
      {label ? (
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
          {label}
        </Typography>
      ) : null}
      {rotating}
    </Card>
  );
};
