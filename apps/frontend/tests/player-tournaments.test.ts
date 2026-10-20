import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playerTournamentBlockedReason, registerPlayerInTournaments } from '../src/utils/playerTournamentRegistrations';
import type { TeamRegistrationWithRoster } from '../src/api/teams.api';

test('a new player gets one identity and independent entries in every selected tournament', async () => {
  const created: string[] = [];
  const added: string[][] = [];
  const result = await registerPlayerInTournaments(['liga', 'copa', 'especial'], undefined,
    async (id) => { created.push(id); return { playerId: 'player' }; },
    async (id, playerId) => { added.push([id, playerId]); });
  assert.deepEqual(created, ['liga']);
  assert.deepEqual(added, [['copa', 'player'], ['especial', 'player']]);
  assert.deepEqual(result.succeeded, ['liga', 'copa', 'especial']);
  assert.equal(result.playerId, 'player');
  assert.equal(result.failed.length, 0);
});

test('a rejected first tournament does not prevent creating the player in another eligible roster', async () => {
  const ageError = new Error('AGE');
  const created: string[] = [];
  const added: string[] = [];
  const result = await registerPlayerInTournaments(['menores', 'adultos', 'copa'], undefined,
    async (id) => { created.push(id); if (id === 'menores') throw ageError; return { playerId: 'player' }; },
    async (id) => { added.push(id); });
  assert.deepEqual(created, ['menores', 'adultos']);
  assert.deepEqual(added, ['copa']);
  assert.deepEqual(result.failed, [{ id: 'menores', error: ageError }]);
  assert.deepEqual(result.succeeded, ['adultos', 'copa']);
});

test('partial retries reuse the created identity and only process pending tournaments', async () => {
  const result = await registerPlayerInTournaments(['liga', 'copa'], undefined,
    async () => ({ playerId: 'player' }), async () => { throw new Error('FULL'); });
  const retried: string[][] = [];
  const retry = await registerPlayerInTournaments(result.failed.map(({ id }) => id), result.playerId,
    async () => { assert.fail('must not create another player'); },
    async (id, playerId) => { retried.push([id, playerId]); });
  assert.deepEqual(retried, [['copa', 'player']]);
  assert.deepEqual(retry.succeeded, ['copa']);
});

test('existing players are reused across tournaments, with duplicate targets removed', async () => {
  const added: string[][] = [];
  await registerPlayerInTournaments(['liga', 'copa', 'liga'], 'existing',
    async () => { assert.fail('existing players must not be created'); },
    async (id, playerId) => { added.push([id, playerId]); });
  assert.deepEqual(added, [['liga', 'existing'], ['copa', 'existing']]);
});

test('closed, full and already assigned rosters cannot be selected for the player', () => {
  const registration = { status: 'ACTIVE', outcome: 'NONE', competition: { status: 'DRAFT', maxPlayers: 2 }, roster: [] } as unknown as TeamRegistrationWithRoster;
  assert.equal(playerTournamentBlockedReason(registration, 'player'), null);
  assert.equal(playerTournamentBlockedReason({ ...registration, outcome: 'WITHDRAWN' }, 'player'), 'Plantilla cerrada');
  assert.equal(playerTournamentBlockedReason({ ...registration, competition: { ...registration.competition, status: 'FINISHED' } }, 'player'), 'Plantilla cerrada');
  const entry = { playerId: 'player', status: 'INACTIVE' } as TeamRegistrationWithRoster['roster'][number];
  assert.equal(playerTournamentBlockedReason({ ...registration, roster: [entry] }, 'player'), 'Ya pertenece a esta plantilla');
  assert.equal(playerTournamentBlockedReason({ ...registration, roster: [{ ...entry, playerId: 'other', status: 'ACTIVE' }, { ...entry, playerId: 'another', status: 'ACTIVE' }] }, 'player'), 'Sin cupo disponible');
});
