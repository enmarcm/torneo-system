import { test } from 'node:test';
import assert from 'node:assert/strict';
import { historyFiltersSchema } from '../src/modules/history/history.schema';
import { summarizeTeamMatches } from '../src/modules/history/history.service';

test('historical filters reject malformed scopes and unbounded pages', () => {
  assert.equal(historyFiltersSchema.safeParse({ page: '0' }).success, false);
  assert.equal(historyFiltersSchema.safeParse({ limit: '201' }).success, false);
  assert.equal(historyFiltersSchema.safeParse({ year: 'wrong' }).success, false);
  assert.equal(historyFiltersSchema.safeParse({ competitionId: 'wrong' }).success, false);
  assert.equal(historyFiltersSchema.safeParse({ sort: 'goals; DROP TABLE' }).success, false);
  assert.deepEqual(historyFiltersSchema.parse({ year: '2024', page: '2' }), { year: 2024, page: 2, limit: 25, sort: 'goals' });
});

test('team results use home and away perspectives without counting unrelated matches', () => {
  const results = summarizeTeamMatches('club', [
    { homeRegistrationId: 'club', awayRegistrationId: 'other', homeScore: 3, awayScore: 1 },
    { homeRegistrationId: 'other', awayRegistrationId: 'club', homeScore: 2, awayScore: 2 },
    { homeRegistrationId: 'other', awayRegistrationId: 'club', homeScore: 4, awayScore: 1 },
    { homeRegistrationId: 'unrelated', awayRegistrationId: 'other', homeScore: 99, awayScore: 0 },
  ]);
  assert.deepEqual(results, { matchesPlayed: 3, wins: 1, draws: 1, losses: 1, goalsFor: 6, goalsAgainst: 7 });
});
