import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conflictsWithSelectedDivision, registerSelectedCompetitions } from '../src/utils/batchRegistrations';
import type { Competition } from '../src/api/competitions.api';

const division = (id: string, changes: Partial<Competition> = {}) => ({
  id, editionId: 'edition', ageGroup: 'ADULT' as const, kind: 'LEAGUE_DIVISION' as const,
  leagueSystemId: 'league', ...changes,
});

test('multiple categories register once each and all successes are reported', async () => {
  const calls: string[] = [];
  const result = await registerSelectedCompetitions(['liga', 'copa', 'menores', 'copa'], async (id) => { calls.push(id); });
  assert.deepEqual(calls, ['liga', 'copa', 'menores']);
  assert.deepEqual(result, { succeeded: calls, failed: [] });
});

test('partial failures preserve successes and retry only the failed category', async () => {
  const error = new Error('No hay cupo');
  const calls: string[] = [];
  const result = await registerSelectedCompetitions(['liga', 'copa', 'menores'], async (id) => {
    calls.push(id);
    if (id === 'copa') throw error;
  });
  assert.deepEqual(calls, ['liga', 'copa', 'menores']);
  assert.deepEqual(result.succeeded, ['liga', 'menores']);
  assert.deepEqual(result.failed, [{ id: 'copa', error }]);
  const retried: string[] = [];
  await registerSelectedCompetitions(result.failed.map(({ id }) => id), async (id) => { retried.push(id); });
  assert.deepEqual(retried, ['copa']);
});

test('the selected division remains removable and excludes other divisions in its league', () => {
  const selected = division('primera');
  assert.equal(conflictsWithSelectedDivision(selected, [selected]), false);
  assert.equal(conflictsWithSelectedDivision(division('segunda'), [selected]), true);
  assert.equal(conflictsWithSelectedDivision(division('copa', { kind: 'CUP' }), [selected]), false);
  assert.equal(conflictsWithSelectedDivision(division('menores', { leagueSystemId: 'youth-league', ageGroup: 'YOUTH' }), [selected]), false);
  assert.equal(conflictsWithSelectedDivision(division('other-season', { leagueSystemId: 'next-league', editionId: 'next-edition' }), [selected]), false);
});

test('legacy leagues without a system use edition and age group to prevent conflicting selections', () => {
  const selected = division('primera', { leagueSystemId: null });
  assert.equal(conflictsWithSelectedDivision(division('segunda', { leagueSystemId: null }), [selected]), true);
  assert.equal(conflictsWithSelectedDivision(division('menores', { leagueSystemId: null, ageGroup: 'YOUTH' }), [selected]), false);
  assert.equal(conflictsWithSelectedDivision(division('next', { leagueSystemId: null, editionId: 'next' }), [selected]), false);
});
