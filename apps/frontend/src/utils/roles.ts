/** Espejo de `apps/backend/src/config/roles.ts`: si allá cambia, acá también. */
export const USER_ROLES = ['ADMIN', 'COMMUNITY_MANAGER', 'SCOREKEEPER', 'TEAM_LEADER'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador general',
  COMMUNITY_MANAGER: 'Community manager',
  SCOREKEEPER: 'Anotador',
  TEAM_LEADER: 'Líder de equipo',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: 'Hace todo y es el único que administra las cuentas del sistema.',
  COMMUNITY_MANAGER: 'Publicidad e imágenes de categorías, competiciones y equipos.',
  SCOREKEEPER: 'Resultados de los partidos: iniciar, cargar goles y tarjetas, finalizar.',
  TEAM_LEADER: 'Delegado de un club: entra al panel de su equipo.',
};

/** Cuentas que se crean desde el panel sin pasar por el alta de un equipo. */
export const STAFF_ROLES: UserRole[] = ['ADMIN', 'COMMUNITY_MANAGER', 'SCOREKEEPER'];

export const getRoleLabel = (role?: string | null) =>
  role && role in ROLE_LABELS ? ROLE_LABELS[role as UserRole] : 'Sin rol';

/** Lo que cada perfil puede hacer en el panel. */
export const permissionsFor = (role?: UserRole | null) => ({
  /** Todo lo que no esté explícitamente compartido con otro perfil. */
  isAdmin: role === 'ADMIN',
  manageUsers: role === 'ADMIN',
  manageAds: role === 'ADMIN' || role === 'COMMUNITY_MANAGER',
  manageImages: role === 'ADMIN' || role === 'COMMUNITY_MANAGER',
  scoreMatches: role === 'ADMIN' || role === 'SCOREKEEPER',
  /** Crear, reprogramar o borrar partidos, y sortear el calendario. */
  manageSchedule: role === 'ADMIN',
});

export type Permissions = ReturnType<typeof permissionsFor>;
