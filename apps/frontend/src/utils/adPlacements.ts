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
  /**
   * Proporción fija de la ranura. La imagen la llena recortándose, así todas las
   * piezas de una misma ubicación miden igual sin importar qué subió el
   * administrador: es lo que evita el panel a medio llenar de blanco.
   */
  ratio?: string;
}

/**
 * Medida única de toda la publicidad del sitio: 1200 × 240 px, proporción 5:1.
 *
 * Dos decisiones juntas. Una sola medida, porque antes cada ubicación pedía algo
 * distinto (5:1, 6:1, 1:1, 15:2) y el mismo arte no servía en dos lugares. Y que
 * esa medida sea chata: una pieza cuadrada o 2:1 a ancho completo pasa los 500px
 * de alto y empuja el resultado del partido fuera de la primera pantalla, que es
 * justo lo que el visitante vino a buscar.
 */
export const AD_SIZE_HINT = '1200 × 240 px (5:1)';
export const AD_RATIO = '5 / 1';
/** La tira de logos no lleva caja: mismo lienzo, recortado al logo. */
export const AD_LOGO_HINT = '1200 × 240 px (5:1), PNG con fondo transparente';

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
    hint: AD_SIZE_HINT,
    ratio: AD_RATIO,
  },
  {
    value: 'HOME_INLINE',
    label: 'Portada, entre secciones',
    where: 'En la portada, entre los próximos partidos y las competiciones.',
    variant: 'panel',
    hint: AD_SIZE_HINT,
    ratio: AD_RATIO,
  },
  {
    value: 'MATCH_LIST',
    label: 'Calendario',
    where: 'Dentro del listado de partidos, después de los primeros días.',
    variant: 'panel',
    hint: AD_SIZE_HINT,
    ratio: AD_RATIO,
  },
  {
    value: 'MATCH_DETAIL',
    label: 'Ficha de partido',
    where: 'Al pie del detalle que se abre al tocar un partido.',
    variant: 'bare',
    hint: AD_SIZE_HINT,
    ratio: AD_RATIO,
  },
  {
    value: 'STANDINGS',
    label: 'Tabla de posiciones',
    where: 'Debajo de la tabla, en la pantalla de competiciones.',
    variant: 'panel',
    hint: AD_SIZE_HINT,
    ratio: AD_RATIO,
  },
  {
    value: 'LIVE',
    label: 'En vivo',
    where: 'En la pantalla de partidos en vivo.',
    variant: 'panel',
    hint: AD_SIZE_HINT,
    ratio: AD_RATIO,
  },
  {
    value: 'STATS',
    label: 'Estadísticas',
    where: 'En la pantalla de goleadores y estadísticas.',
    variant: 'panel',
    hint: AD_SIZE_HINT,
    ratio: AD_RATIO,
  },
  {
    value: 'TEAMS',
    label: 'Equipos',
    where: 'En el listado público de equipos.',
    variant: 'panel',
    hint: AD_SIZE_HINT,
    ratio: AD_RATIO,
  },
  {
    value: 'SIDEBAR',
    label: 'Columna lateral',
    where: 'Al costado del contenido, apilados uno debajo del otro.',
    variant: 'sidebar',
    hint: AD_SIZE_HINT,
    ratio: AD_RATIO,
  },
  {
    value: 'FOOTER',
    label: 'Pie de página',
    where: 'Panel ancho dentro del pie, en todas las pantallas públicas.',
    variant: 'panel',
    hint: AD_SIZE_HINT,
    ratio: AD_RATIO,
  },
  {
    value: 'FOOTER_LOGOS',
    label: 'Tira de logos del pie',
    where: 'Fila de logos al pie, sin fondo y todos al mismo alto.',
    variant: 'logos',
    hint: AD_LOGO_HINT,
  },
];

const BY_VALUE = new Map(AD_PLACEMENTS.map((p) => [p.value, p]));

export const getPlacementMeta = (value: AdPlacement): AdPlacementMeta | undefined =>
  BY_VALUE.get(value);

export const getPlacementLabel = (value: AdPlacement): string =>
  BY_VALUE.get(value)?.label ?? value;
