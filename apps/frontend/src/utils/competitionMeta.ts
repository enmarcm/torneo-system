import type { Competition } from '@/api/competitions.api';
import { getDivisionLabel } from './statusLabels';

/**
 * Forma laxa de una competición: sirve tanto para la entidad completa como para
 * el resumen que viaja dentro de un partido o de una línea de estadísticas.
 */
export interface CompetitionLike {
  name: string;
  kind?: Competition['kind'] | null;
  ageGroup?: Competition['ageGroup'] | null;
  format?: Competition['format'] | null;
  division?: string | null;
  divisionLevel?: number | null;
  ageMin?: number | null;
  ageMax?: number | null;
}

export const getCompetitionAgeGroup = (c: CompetitionLike): Competition['ageGroup'] =>
  c.ageGroup ?? (c.kind === 'YOUTH' ? 'YOUTH' : 'ADULT');

export const AGE_GROUP_LABELS: Record<Competition['ageGroup'], string> = { ADULT: 'Adultos', YOUTH: 'Menores' };

export type TagColor = 'primary' | 'secondary' | 'info' | 'warning' | 'default';

export interface CompetitionTag {
  label: string;
  color: TagColor;
}

/** Orden en que se presentan los torneos al público: liga, copa, menores y especiales. */
const KIND_ORDER: Record<NonNullable<Competition['kind']>, number> = {
  LEAGUE_DIVISION: 0,
  STANDALONE_LEAGUE: 1,
  CUP: 2,
  YOUTH: 3,
  SPECIAL: 4,
};

const KIND_TAG: Record<NonNullable<Competition['kind']>, CompetitionTag> = {
  LEAGUE_DIVISION: { label: 'Liga', color: 'primary' },
  STANDALONE_LEAGUE: { label: 'Liga sin divisiones', color: 'primary' },
  CUP: { label: 'Copa', color: 'secondary' },
  YOUTH: { label: 'Menores', color: 'info' },
  SPECIAL: { label: 'Torneo especial', color: 'warning' },
};

const normalize = (v: string) =>
  v
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/**
 * Etiquetas con las que se identifica un torneo en la parte pública: si es una
 * división de la liga (y cuál), si es la copa, si es de menores o un torneo
 * especial como el gremial.
 *
 * Adultos y Menores son apartados independientes; no imponen límites de edad.
 */
export const getCompetitionTags = (c: CompetitionLike): CompetitionTag[] => {
  const tags: CompetitionTag[] = [];

  if (c.kind === 'LEAGUE_DIVISION') {
    const division = getDivisionLabel(c.divisionLevel) ?? c.division;
    tags.push({ label: division ?? 'Liga', color: 'primary' });
  } else if (c.kind) {
    tags.push(KIND_TAG[c.kind]);
    if (c.division) tags.push({ label: c.division, color: 'default' });
  }

  // Solo se aclara el formato cuando no se deduce del tipo de torneo.
  if (c.format === 'GROUPS_KNOCKOUT' && c.kind !== 'CUP') {
    tags.push({ label: 'Grupos y eliminatoria', color: 'default' });
  }

  if (c.ageGroup) tags.push({ label: AGE_GROUP_LABELS[c.ageGroup], color: 'default' });
  return tags;
};

/** Las mismas etiquetas en una sola línea, para subtítulos y selects. */
export const getCompetitionSubtitle = (c: CompetitionLike): string =>
  getCompetitionTags(c)
    .map((t) => t.label)
    .join(' · ');

/**
 * Nombre corto para listas mixtas (calendario, goleadores): el nombre del torneo
 * y, si es una división, cuál, porque varias comparten nombre entre sí.
 */
export const getCompetitionShortLabel = (c: CompetitionLike): string => {
  const division = getDivisionLabel(c.divisionLevel) ?? c.division;
  if (!division || normalize(division) === normalize(c.name)) return c.name;
  return `${c.name} · ${division}`;
};

/** Liga (por división) → copa → menores → especiales, y dentro de cada una por nombre. */
export const sortCompetitions = <T extends CompetitionLike>(list: T[]): T[] =>
  [...list].sort((a, b) => {
    const groupDiff = (getCompetitionAgeGroup(a) === 'ADULT' ? 0 : 1) - (getCompetitionAgeGroup(b) === 'ADULT' ? 0 : 1);
    if (groupDiff) return groupDiff;
    const ka = a.kind ? KIND_ORDER[a.kind] : 99;
    const kb = b.kind ? KIND_ORDER[b.kind] : 99;
    if (ka !== kb) return ka - kb;
    const da = a.divisionLevel ?? 99;
    const db = b.divisionLevel ?? 99;
    if (da !== db) return da - db;
    return a.name.localeCompare(b.name);
  });
