import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTeamCompetitions, getVisibleTeamRegistrations } from '../src/utils/teamRegistrations';
import type { TeamRegistrationWithRoster } from '../src/api/teams.api';

const registration = (id: string, level: number, editionId = 'edition') => ({
  id: `registration-${id}`, teamId: 'club', competitionId: id, groupId: null, status: 'ACTIVE', outcome: 'NONE', roster: [],
  competition: { id, name: 'Liga', editionId, kind: 'LEAGUE_DIVISION', ageGroup: 'ADULT', leagueSystemId: 'league', format: 'LEAGUE', division: null, divisionLevel: level, maxPlayers: 25, minPlayers: 11, ageMin: 18, ageMax: null, status: 'ACTIVE' },
}) as TeamRegistrationWithRoster;

test('the delegate competition list contains only assigned divisions', () => {
  const assigned = [registration('primera', 1)];
  const competitions = getTeamCompetitions(assigned);
  assert.deepEqual(competitions.map((competition) => competition.id), ['primera']);
  assert.equal(competitions.some((competition) => competition.divisionLevel === 2 || competition.divisionLevel === 3), false);
});

test('a new registration appears before its tournament starts or players are added', () => {
  const assigned = registration('new-tournament', 1);
  assigned.competition.status = 'DRAFT';
  const visible = getVisibleTeamRegistrations([assigned]);
  assert.equal(visible.length, 1);
  assert.equal(visible[0].roster.length, 0);
  assert.deepEqual(getTeamCompetitions(visible).map((competition) => competition.id), ['new-tournament']);
});

test('withdrawn and finished division registrations stay in history, without appearing as current tournaments', () => {
  const primera = registration('primera', 1);
  const segunda = { ...registration('segunda', 2), outcome: 'WITHDRAWN' as const };
  const tercera = registration('tercera', 3, 'old-edition');
  tercera.competition.status = 'FINISHED';
  const all = [primera, segunda, tercera];
  assert.deepEqual(getVisibleTeamRegistrations(all).map((entry) => entry.id), [primera.id]);
  assert.equal(getVisibleTeamRegistrations(all, true).length, 3);
  assert.equal(getVisibleTeamRegistrations(all, true)[2], tercera);
});

test('history selects only this club registrations in the selected edition', () => {
  const registrations = [registration('primera', 1, 'current'), registration('segunda', 2, 'previous')];
  assert.deepEqual(getTeamCompetitions(registrations, 'current').map((competition) => competition.id), ['primera']);
  assert.deepEqual(getTeamCompetitions(registrations, 'previous').map((competition) => competition.id), ['segunda']);
});

// Give Zustand persistence an isolated in-memory storage in this Node test.
const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
} });
const { useAuthStore } = await import('../src/store/useAuthStore');
const { queryClient } = await import('../src/lib/queryClient');
queryClient.setDefaultOptions({ ...queryClient.getDefaultOptions(), queries: { ...queryClient.getDefaultOptions().queries, gcTime: Infinity } });
const admin = { id: 'admin', username: 'admin', email: null, role: 'ADMIN' as const, teamId: null };
const delegate = { id: 'delegate', username: 'delegate', email: null, role: 'TEAM_LEADER' as const, teamId: 'club' };

test('changing accounts clears old player and roster caches; token renewal preserves the same account data', () => {
  useAuthStore.getState().setSession(admin, 'test-admin-token');
  queryClient.setQueryData(['players'], [{ id: 'unrelated-player' }]);
  queryClient.setQueryData(['roster', 'registration-primera'], []);
  useAuthStore.getState().setSession(delegate, 'test-delegate-token');
  assert.equal(queryClient.getQueryData(['players']), undefined);
  assert.equal(queryClient.getQueryData(['roster', 'registration-primera']), undefined);
  const owned = [{ id: 'club-player' }];
  queryClient.setQueryData(['players'], owned);
  useAuthStore.getState().setAccessToken('test-refreshed-token');
  assert.deepEqual(queryClient.getQueryData(['players']), owned);
  useAuthStore.getState().setUser({ ...delegate, email: 'delegate@example.test' });
  assert.deepEqual(queryClient.getQueryData(['players']), owned);
  useAuthStore.getState().setUser({ ...delegate, teamId: 'other-club' });
  assert.equal(queryClient.getQueryData(['players']), undefined);
  useAuthStore.getState().logout();
  assert.equal(queryClient.getQueryCache().getAll().length, 0);
});

test('a delayed response from the prior account cannot repopulate the new account cache', async () => {
  useAuthStore.getState().setSession(admin, 'test-admin-token');
  let finishOld!: (value: unknown[]) => void;
  const oldRequest = queryClient.fetchQuery({ queryKey: ['players'], queryFn: () => new Promise<unknown[]>((resolve) => { finishOld = resolve; }) }).catch(() => undefined);
  useAuthStore.getState().setSession(delegate, 'test-delegate-token');
  finishOld([{ id: 'admin-only-player' }]);
  await oldRequest;
  assert.equal(queryClient.getQueryData(['players']), undefined);
  await queryClient.fetchQuery({ queryKey: ['players'], queryFn: async () => [{ id: 'club-player' }] });
  assert.deepEqual(queryClient.getQueryData(['players']), [{ id: 'club-player' }]);
  useAuthStore.getState().logout();
});
