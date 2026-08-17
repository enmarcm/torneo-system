export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  DRAFT: 'Borrador',
  FINISHED: 'Finalizado',
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  SCHEDULED: 'Programado',
  LIVE: 'En vivo',
  POSTPONED: 'Pospuesto',
  LEAGUE: 'Liga',
  GROUPS_KNOCKOUT: 'Copa',
  GROUP: 'Grupos',
  R16: 'Octavos',
  QUARTER: 'Cuartos',
  SEMI: 'Semifinal',
  THIRD: 'Tercer puesto',
  FINAL: 'Final',
  GOAL: 'Gol',
  YELLOW: 'Amarilla',
  RED: 'Roja',
  SUB: 'Sustitución',
  OTHER: 'Otro',
  CEDULA: 'Cédula',
  PARTIDA: 'Partida de nacimiento',
  ADMIN: 'Administrador',
  TEAM_LEADER: 'Líder de equipo',
  HOME_BANNER: 'Banner principal',
  SIDEBAR: 'Sidebar',
  FOOTER: 'Footer',
  LEAGUE_DIVISION: 'División de liga',
  CUP: 'Copa',
  YOUTH: 'Menores',
  SPECIAL: 'Torneo especial',
  PROMOTED: 'Ascendido',
  RELEGATED: 'Descendido',
  WITHDRAWN: 'No participa',
  NONE: 'Sin decisión',
  CLUB: 'Club completo',
  COMPETITION: 'Solo esa competición',
};

export const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default' | 'secondary'> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  DRAFT: 'warning',
  FINISHED: 'info',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  SCHEDULED: 'info',
  LIVE: 'error',
  POSTPONED: 'warning',
  LEAGUE: 'info',
  GROUPS_KNOCKOUT: 'secondary',
  GROUP: 'info',
  R16: 'info',
  QUARTER: 'info',
  SEMI: 'info',
  THIRD: 'info',
  FINAL: 'warning',
  PROMOTED: 'success',
  RELEGATED: 'error',
  WITHDRAWN: 'default',
  NONE: 'default',
};

const DIVISION_NAMES: Record<number, string> = {
  1: 'Primera División',
  2: 'Segunda División',
  3: 'Tercera División',
  4: 'Cuarta División',
};

/**
 * Nombre del nivel de división dentro del sistema de liga.
 * El nivel 1 está por encima del 2, y así sucesivamente.
 */
export const getDivisionLabel = (level?: number | null): string | null =>
  level == null ? null : (DIVISION_NAMES[level] ?? `División ${level}`);

export const getStatusLabel = (status: string): string => STATUS_LABELS[status] ?? status;

export const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' | 'secondary' =>
  STATUS_COLORS[status] ?? 'default';
