import type { AdPlacement } from '@/api/ads.api';

/** Cómo se pinta una ranura. Lo decide la ubicación, no el anuncio. */
export type AdVariant = 'panel' | 'bare' | 'logos' | 'sidebar';

export interface AdPlacementMeta {
  value: AdPlacement;
  label: string;
  /** Dónde aparece, en palabras del administrador. */
  where: string;
  variant: AdVariant;
  /** Medida recomendada de la imagen, para que el que la sube sepa qué mandar. */
  hint: string;
}

/**
 * Catálogo único de ubicaciones publicitarias: lo usa el panel de administración
 * para explicar cada ranura y el sitio público para saber con qué forma pintarla.
 *
 * El orden es el del recorrido del visitante: portada, contenido, pie.
 */
export const AD_PLACEMENTS: AdPlacementMeta[] = [
  {
    value: 'HOME_BANNER',
    label: 'Banner principal',
    where: 'Arriba de la portada, debajo de la barra de la edición.',
    variant: 'panel',
    hint: 'Horizontal, tipo 1200 × 240 px',
  },
  {
    value: 'HOME_INLINE',
    label: 'Portada, entre secciones',
    where: 'En la portada, entre los próximos partidos y las competiciones.',
    variant: 'panel',
    hint: 'Horizontal, tipo 1200 × 200 px',
  },
  {
    value: 'MATCH_LIST',
    label: 'Calendario',
    where: 'Dentro del listado de partidos, después de los primeros días.',
    variant: 'panel',
    hint: 'Horizontal, tipo 1200 × 200 px',
  },
  {
    value: 'MATCH_DETAIL',
    label: 'Ficha de partido',
    where: 'Al pie del detalle que se abre al tocar un partido.',
    variant: 'bare',
    hint: 'Horizontal y chato, tipo 600 × 120 px',
  },
  {
    value: 'STANDINGS',
    label: 'Tabla de posiciones',
    where: 'Debajo de la tabla, en la pantalla de competiciones.',
    variant: 'panel',
    hint: 'Horizontal, tipo 1200 × 200 px',
  },
  {
    value: 'LIVE',
    label: 'En vivo',
    where: 'En la pantalla de partidos en vivo.',
    variant: 'panel',
    hint: 'Horizontal, tipo 1200 × 200 px',
  },
  {
    value: 'STATS',
    label: 'Estadísticas',
    where: 'En la pantalla de goleadores y estadísticas.',
    variant: 'panel',
    hint: 'Horizontal, tipo 1200 × 200 px',
  },
  {
    value: 'TEAMS',
    label: 'Equipos',
    where: 'En el listado público de equipos.',
    variant: 'panel',
    hint: 'Horizontal, tipo 1200 × 200 px',
  },
  {
    value: 'SIDEBAR',
    label: 'Columna lateral',
    where: 'Al costado del contenido, apilados uno debajo del otro.',
    variant: 'sidebar',
    hint: 'Vertical o cuadrado, tipo 400 × 400 px',
  },
  {
    value: 'FOOTER',
    label: 'Pie de página',
    where: 'Panel ancho dentro del pie, en todas las pantallas públicas.',
    variant: 'panel',
    hint: 'Horizontal, tipo 1200 × 160 px',
  },
  {
    value: 'FOOTER_LOGOS',
    label: 'Tira de logos del pie',
    where: 'Fila de logos al pie, sin fondo y todos al mismo alto.',
    variant: 'logos',
    hint: 'Logo suelto en PNG con fondo transparente, alto ≥ 120 px',
  },
];

const BY_VALUE = new Map(AD_PLACEMENTS.map((p) => [p.value, p]));

export const getPlacementMeta = (value: AdPlacement): AdPlacementMeta | undefined =>
  BY_VALUE.get(value);

export const getPlacementLabel = (value: AdPlacement): string =>
  BY_VALUE.get(value)?.label ?? value;
