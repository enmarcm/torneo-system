/**
 * Quién puede qué. Los perfiles de staff se definen acá y no sueltos en cada
 * router: al agregar un rol nuevo se toca una sola lista por permiso.
 */
export const USER_ROLES = ['ADMIN', 'COMMUNITY_MANAGER', 'SCOREKEEPER', 'TEAM_LEADER'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador general',
  COMMUNITY_MANAGER: 'Community manager',
  SCOREKEEPER: 'Anotador',
  TEAM_LEADER: 'Líder de equipo',
};

/** Roles que se administran desde el panel de usuarios sin pasar por un equipo. */
export const STAFF_ROLES = ['ADMIN', 'COMMUNITY_MANAGER', 'SCOREKEEPER'] as const satisfies readonly UserRole[];

/** Publicidad e imágenes del sitio. */
export const MEDIA_ROLES = ['ADMIN', 'COMMUNITY_MANAGER'] as const satisfies readonly UserRole[];

/** Resultados de los partidos: iniciar, cargar eventos, finalizar. */
export const SCORING_ROLES = ['ADMIN', 'SCOREKEEPER'] as const satisfies readonly UserRole[];

/**
 * Campos de imagen que el community manager puede tocar en cada entidad. Lo
 * demás de esas fichas (nombre, cupos, formato) sigue siendo del administrador.
 */
export const MEDIA_FIELDS = {
  category: ['imageUrl'],
  competition: ['imageUrl'],
  team: ['logoUrl'],
} as const;
