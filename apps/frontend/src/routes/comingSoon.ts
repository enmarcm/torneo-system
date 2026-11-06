import { ROUTES } from './routes';

/**
 * Secciones públicas que todavía no están listas. Mientras una ruta esté acá,
 * el layout público muestra la pantalla de "próximamente" en lugar de la
 * página, el menú le pone la etiqueta "Pronto" y la portada deja de enlazarla.
 *
 * Para lanzar una sección, se borra su línea. Para marcar otra como pendiente,
 * se agrega una: no hay que tocar el router ni la página.
 */
export interface ComingSoonInfo {
  title: string;
  description: string;
  /** Adónde mandar al visitante mientras tanto. */
  alternative?: { label: string; to: string };
}

export const COMING_SOON: Record<string, ComingSoonInfo> = {
  [ROUTES.public.live]: {
    title: 'En vivo',
    description:
      'Estamos armando los marcadores en vivo. Muy pronto vas a poder seguir cada gol, minuto a minuto, desde tu teléfono.',
    alternative: { label: 'Ver calendario', to: ROUTES.public.schedule },
  },
};

export const isComingSoon = (to: string) => to in COMING_SOON;
