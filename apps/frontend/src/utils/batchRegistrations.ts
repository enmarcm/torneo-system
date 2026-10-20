import type { Competition } from '@/api/competitions.api';

type Division = Pick<Competition, 'leagueSystemId' | 'editionId' | 'ageGroup'> & { kind: Competition['kind'] | null };

export const divisionSystemKey = (competition: Division) =>
  competition.leagueSystemId ?? `${competition.editionId}:${competition.ageGroup}`;

export const conflictsWithSelectedDivision = (competition: Division & { id: string }, selected: Array<Division & { id: string }>) =>
  competition.kind === 'LEAGUE_DIVISION' && selected.some((other) =>
    other.id !== competition.id && other.kind === 'LEAGUE_DIVISION' && divisionSystemKey(other) === divisionSystemKey(competition));

/** Keep successful registrations when another category fails; retry only failures. */
export async function registerSelectedCompetitions(ids: string[], register: (id: string) => Promise<unknown>) {
  const succeeded: string[] = [];
  const failed: Array<{ id: string; error: unknown }> = [];
  for (const id of new Set(ids)) {
    try {
      await register(id);
      succeeded.push(id);
    } catch (error) {
      failed.push({ id, error });
    }
  }
  return { succeeded, failed };
}
