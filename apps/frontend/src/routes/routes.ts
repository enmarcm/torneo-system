export const ROUTES = {
  login: '/login',
  admin: {
    dashboard: '/admin',
    editions: '/admin/ediciones',
    editionDetail: '/admin/ediciones/:id',
    categories: '/admin/categorias',
    competitions: '/admin/competiciones',
    competitionDetail: '/admin/competiciones/:id',
    teams: '/admin/equipos',
    teamDetail: '/admin/equipos/:id',
    teamBlocks: '/admin/bloqueos',
    players: '/admin/jugadores',
    playerDetail: '/admin/jugadores/:id',
    schedule: '/admin/programacion',
    matchDetail: '/admin/partidos/:id',
    stats: '/admin/estadisticas',
    ads: '/admin/publicidad',
    news: '/admin/noticias',
    media: '/admin/imagenes',
    users: '/admin/usuarios',
    audit: '/admin/auditoria',
  },
  team: {
    home: '/equipo',
    players: '/equipo/jugadores',
    squads: '/equipo/plantillas',
    matches: '/equipo/partidos',
    stats: '/equipo/estadisticas',
    history: '/equipo/historial',
    historyDetail: '/equipo/historial/:id',
  },
  public: {
    home: '/',
    competitions: '/competiciones',
    stats: '/estadisticas',
    teams: '/equipos',
    schedule: '/calendario',
    news: '/noticias',
    newsDetail: '/noticias/:slug',
    live: '/en-vivo',
    /** Ficha de un jugador, buscada por su cédula. */
    playerSearch: '/jugador',
  },
} as const;

/**
 * Pantallas de partidos y tablas: mientras baja su código, el loader es el de
 * la cancha con reflectores (MatchLoader) y no el balón del resto del sitio.
 */
const MATCH_ROUTES: string[] = [
  ROUTES.public.live,
  ROUTES.public.schedule,
  ROUTES.public.competitions,
  ROUTES.public.stats,
  ROUTES.team.matches,
  ROUTES.team.stats,
  ROUTES.team.history,
  ROUTES.admin.schedule,
  ROUTES.admin.stats,
];
export const isMatchRoute = (pathname: string) =>
  MATCH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
