import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import express, { type ErrorRequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { ZodError } from 'zod';
import { prisma } from '../src/lib/prisma';
import { minioClient } from '../src/lib/minio';
import { env } from '../src/config/env';
import { AppError } from '../src/utils/app-error';
import { rostersService } from '../src/modules/rosters/rosters.service';
import { teamsRouter } from '../src/modules/teams/teams.routes';
import { rostersRouter } from '../src/modules/rosters/rosters.routes';
import { playersRouter } from '../src/modules/players/players.routes';
import { playersService } from '../src/modules/players/players.service';

const stub = (t: TestContext, delegate: object, method: string, implementation: (...args: any[]) => any) => {
  const original = Reflect.get(delegate, method);
  const mocked = t.mock.fn(implementation);
  Reflect.set(delegate, method, mocked);
  t.after(() => { Reflect.set(delegate, method, original); });
  return mocked;
};
const competitionId = '11111111-1111-4111-8111-111111111111';
const registrationId = '22222222-2222-4222-8222-222222222222';
const input = { documentType: 'CEDULA' as const, documentNumber: '12345678', firstName: 'Ana', lastName: 'Perez', birthDate: new Date('2000-01-01'), jerseyNumber: 9, photoUrl: 'https://assets.example.test/player.webp', identityPhotoKey: 'identity/33333333-3333-4333-8333-333333333333/44444444-4444-4444-8444-444444444444.webp' };

const setup = (t: TestContext, initialRegistration = true) => {
  stub(t, minioClient, 'statObject', async () => ({ size: 100 }));
  const profiles: any[] = [];
  const entries: any[] = [];
  const competition = { id: competitionId, editionId: 'edition', kind: 'STANDALONE_LEAGUE', ageGroup: 'ADULT', format: 'LEAGUE', status: 'DRAFT', ageMin: 18, ageMax: null, minPlayers: 11, maxPlayers: 25, requiresAdminEligibility: true, edition: { id: 'edition', name: 'Apertura', year: 2026 } };
  const registration = { id: registrationId, teamId: 'club', competitionId, status: 'ACTIVE', outcome: 'NONE', competition };
  const registrations: any[] = initialRegistration ? [registration] : [];
  const transaction = stub(t, prisma, '$transaction', async (callback, options) => {
    assert.equal(options.isolationLevel, 'Serializable');
    const profileCount = profiles.length;
    const entryCount = entries.length;
    try { return await callback(prisma); }
    catch (error) { profiles.length = profileCount; entries.length = entryCount; throw error; }
  });
  stub(t, prisma.competition, 'findUnique', async () => competition);
  stub(t, prisma.teamRegistration, 'findUnique', async ({ where }) => registrations.find((r) => r.id === where.id) ?? (where.id === 'foreign-registration' ? { ...registration, id: 'foreign-registration', teamId: 'other-club' } : null));
  stub(t, prisma.teamRegistration, 'findFirst', async ({ where }) => registrations.find((r) => r.teamId === where.teamId && r.competitionId === where.competitionId) ?? null);
  stub(t, prisma.teamRegistration, 'create', async ({ data }) => { const created = { ...registration, ...data }; registrations.push(created); return created; });
  stub(t, prisma.teamRegistration, 'findMany', async ({ where }) => registrations.filter((r) => r.teamId === where.teamId).map((r) => ({ ...r, roster: entries.filter((e) => e.teamRegistrationId === r.id) })));
  stub(t, prisma.player, 'findUnique', async ({ where }) => profiles.find((p) => where.id ? p.id === where.id : p.documentType === where.documentType_documentNumber.documentType && p.documentNumber === where.documentType_documentNumber.documentNumber) ?? null);
  const createProfile = stub(t, prisma.player, 'create', async ({ data }) => { const player = { id: `player-${profiles.length}`, status: 'ACTIVE', ...data }; profiles.push(player); return player; });
  stub(t, prisma.rosterEntry, 'count', async ({ where }) => entries.filter((e) => e.teamRegistrationId === where.teamRegistrationId && e.status === 'ACTIVE').length);
  stub(t, prisma.rosterEntry, 'findUnique', async ({ where }) => entries.find((e) => e.playerId === where.playerId_teamRegistrationId.playerId && e.teamRegistrationId === where.playerId_teamRegistrationId.teamRegistrationId) ?? null);
  const createEntry = stub(t, prisma.rosterEntry, 'create', async ({ data }) => { const entry = { id: `entry-${entries.length}`, ...data, status: 'ACTIVE', player: profiles.find((p) => p.id === data.playerId), stats: {} }; entries.push(entry); return entry; });
  return { profiles, entries, competition, registration, registrations, transaction, createProfile, createEntry };
};

test('new players are created and linked to the selected tournament in one transaction', async (t) => {
  const state = setup(t);
  const entry = await rostersService.createPlayer(registrationId, input);
  assert.equal(state.transaction.mock.callCount(), 1);
  assert.equal(state.profiles.length, 1);
  assert.equal(entry.teamRegistrationId, registrationId);
  assert.equal(entry.jerseyNumber, 9);
  assert.equal(entry.player.documentNumber, input.documentNumber);
  assert.equal(entry.eligibilityApproved, false);
});

test('age, capacity and closed registration reject the addition before a profile is created', async (t) => {
  const state = setup(t);
  await assert.rejects(rostersService.createPlayer(registrationId, { ...input, birthDate: new Date('2020-01-01') }), { code: 'AGE' });
  state.competition.maxPlayers = 1;
  state.entries.push({ teamRegistrationId: registrationId, status: 'ACTIVE' });
  await assert.rejects(rostersService.createPlayer(registrationId, input), { code: 'FULL' });
  state.entries.pop();
  state.competition.maxPlayers = 25;
  state.registration.outcome = 'WITHDRAWN';
  await assert.rejects(rostersService.createPlayer(registrationId, input), { code: 'REGISTRATION_CLOSED' });
  assert.equal(state.createProfile.mock.callCount(), 0);
  assert.equal(state.createEntry.mock.callCount(), 0);
});

test('missing registrations and duplicate documents do not leave unassigned profiles', async (t) => {
  const state = setup(t);
  await assert.rejects(rostersService.createPlayer('missing', input), { code: 'NOT_FOUND' });
  await rostersService.createPlayer(registrationId, input);
  await assert.rejects(rostersService.createPlayer(registrationId, input), { code: 'DUPLICATE' });
  assert.equal(state.profiles.length, 1);
  assert.equal(state.entries.length, 1);
});

test('administrator registration appears to the owning delegate, who can add players but cannot assign tournaments', async (t) => {
  const state = setup(t, false);
  let role = 'ADMIN';
  stub(t, prisma.user, 'findUnique', async () => ({ id: '33333333-3333-4333-8333-333333333333', role, status: 'ACTIVE', teamId: 'club', updatedAt: new Date(0) }));
  stub(t, prisma.auditLog, 'create', async () => ({}));
  const app = express(); app.use(express.json());
  app.use('/teams', teamsRouter); app.use('/players', playersRouter); app.use('/', rostersRouter);
  const errors: ErrorRequestHandler = (err, _req, res, _next) => { res.status(err instanceof AppError ? err.statusCode : err instanceof ZodError ? 422 : 500).json({ message: err.message }); };
  app.use(errors);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.on('listening', resolve));
  t.after(() => new Promise<void>((resolve) => { server.closeAllConnections(); server.close(() => resolve()); }));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const token = jwt.sign({ id: '33333333-3333-4333-8333-333333333333' }, env.JWT_ACCESS_SECRET, { algorithm: 'HS256', expiresIn: '1m' });
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const assigned = await fetch(`${base}/teams/club/registrations`, { method: 'POST', headers, body: JSON.stringify({ competitionId }) });
  assert.equal(assigned.status, 201);
  role = 'TEAM_LEADER';
  const result = await fetch(`${base}/teams/club/registrations`, { headers });
  assert.equal(result.status, 200);
  const body = await result.json() as any;
  assert.equal(body.data[0].id, registrationId);
  assert.equal(body.data[0].competition.id, competitionId);
  assert.equal(body.data[0].roster.length, 0);
  const added = await fetch(`${base}/registrations/${registrationId}/roster/players`, { method: 'POST', headers, body: JSON.stringify(input) });
  assert.equal(added.status, 201);
  const fresh = await (await fetch(`${base}/teams/club/registrations`, { headers })).json() as any;
  assert.equal(fresh.data[0].roster.length, 1);
  assert.equal(fresh.data[0].roster[0].player.firstName, input.firstName);
  assert.equal((await fetch(`${base}/teams/club/registrations`, { method: 'POST', headers, body: JSON.stringify({ competitionId }) })).status, 403);
  assert.equal((await fetch(`${base}/teams/other-club/registrations`, { headers })).status, 403);
  assert.equal((await fetch(`${base}/registrations/foreign-registration/roster/players`, { method: 'POST', headers, body: JSON.stringify({ ...input, documentNumber: '9999999' }) })).status, 403);
  assert.equal((await fetch(`${base}/players`, { method: 'POST', headers, body: JSON.stringify(input) })).status, 403);
  stub(t, prisma.player, 'findMany', async () => [{ id: 'other-club-player', firstName: 'Ana', lastName: 'Perez', documentType: 'CEDULA', documentNumber: '12345678', photoUrl: input.photoUrl, birthDate: input.birthDate }]);
  const candidates = await fetch(`${base}/registrations/${registrationId}/roster/candidates?search=Ana`, { headers });
  assert.equal(candidates.status, 200);
  const candidateBody = await candidates.json() as any;
  assert.equal(candidateBody.data[0].id, 'other-club-player');
  assert.equal(candidateBody.data[0].documentMasked, '***5678');
  assert.equal((await fetch(`${base}/registrations/foreign-registration/roster/candidates?search=Ana`, { headers })).status, 403);
  assert.equal((await fetch(`${base}/registrations/${registrationId}/roster/candidates?search=a`, { headers })).status, 422);
  assert.equal((await fetch(`${base}/registrations/${registrationId}/roster/candidates?search=Ana`)).status, 401);
  assert.equal(state.profiles.length, 1);
  assert.equal(state.entries.length, 1);
});


test('an existing club player can have an independent roster entry in another assigned tournament', async (t) => {
  const state = setup(t);
  const first = await rostersService.createPlayer(registrationId, input);
  const secondRegistration = { ...state.registration, id: 'second-registration', competitionId: 'second-tournament', competition: { ...state.competition, id: 'second-tournament', requiresAdminEligibility: false } };
  state.registrations.push(secondRegistration);
  const second = await rostersService.add(secondRegistration.id, first.playerId, 12);
  assert.equal(state.profiles.length, 1);
  assert.equal(state.entries.length, 2);
  assert.equal(second.teamRegistrationId, secondRegistration.id);
  assert.equal(second.playerId, first.playerId);
  assert.equal(second.jerseyNumber, 12);
  assert.equal(second.eligibilityApproved, true);
  assert.equal(first.eligibilityApproved, false);
});

test('a failed roster insert rolls back the newly created profile', async (t) => {
  const state = setup(t);
  state.createEntry.mock.mockImplementation(async () => { throw new Error('Roster insert failed'); });
  await assert.rejects(rostersService.createPlayer(registrationId, input), /Roster insert failed/);
  assert.equal(state.transaction.mock.callCount(), 1);
  assert.equal(state.profiles.length, 0);
  assert.equal(state.entries.length, 0);
});

test('a minor can play for different youth and adult clubs with independent entries and withdrawals', async (t) => {
  const state = setup(t);
  const birthDate = new Date(); birthDate.setUTCFullYear(birthDate.getUTCFullYear() - 16);
  state.competition.ageMin = 12;
  const youthCompetition = { ...state.competition, ageGroup: 'YOUTH', ageMax: 17 };
  state.registration.competition = youthCompetition;
  const youth = await rostersService.createPlayer(registrationId, { ...input, birthDate });
  const adultRegistration = { ...state.registration, id: 'adult-registration', teamId: 'other-club', competition: { ...state.competition, id: 'adult-tournament', ageGroup: 'ADULT', ageMin: 15, ageMax: 50 } };
  state.registrations.push(adultRegistration);
  const adult = await rostersService.add(adultRegistration.id, youth.playerId, 12);
  stub(t, prisma.rosterEntry, 'update', async ({ where, data }) => {
    const entry = state.entries.find((row) => row.id === where.id); Object.assign(entry, data); return entry;
  });
  await rostersService.remove(youth.id);
  assert.equal(state.profiles.length, 1);
  assert.equal(state.entries.length, 2);
  assert.equal(adult.playerId, youth.playerId);
  assert.equal(adult.teamRegistrationId, 'adult-registration');
  assert.equal(adult.jerseyNumber, 12);
  assert.equal(youth.jerseyNumber, 9);
  assert.equal(youth.status, 'INACTIVE');
  assert.equal(adult.status, 'ACTIVE');
  assert.equal(state.profiles[0].status, 'ACTIVE');
});

test('an adult outside the youth competition age range cannot enter its roster', async (t) => {
  const state = setup(t);
  const adult = await rostersService.createPlayer(registrationId, input);
  state.registrations.push({ ...state.registration, id: 'youth-registration', teamId: 'youth-club', competition: { ...state.competition, ageGroup: 'YOUTH', ageMin: 12, ageMax: 17 } });
  await assert.rejects(rostersService.add('youth-registration', adult.playerId), { code: 'AGE' });
  assert.equal(state.profiles.length, 1);
  assert.equal(state.entries.length, 1);
  assert.equal(adult.status, 'ACTIVE');
});

test('candidate search finds another club player without returning birth dates or identity images', async (t) => {
  const state = setup(t);
  state.registration.competition = { ...state.competition, ageMin: 12, ageMax: 17, ageGroup: 'YOUTH' };
  const birthDate = new Date(); birthDate.setUTCFullYear(birthDate.getUTCFullYear() - 16);
  stub(t, prisma.player, 'findMany', async ({ where, select }) => {
    assert.deepEqual(where.rosterEntries, { none: { teamRegistrationId: registrationId } });
    assert.equal(select.identityPhotoKey, undefined);
    return [{ id: 'other-club-minor', firstName: 'Ana', lastName: 'Perez', documentType: 'CEDULA', documentNumber: '12345678', photoUrl: input.photoUrl, birthDate },
      { id: 'adult', firstName: 'Otro', lastName: 'Jugador', documentType: 'CEDULA', documentNumber: '87654321', photoUrl: input.photoUrl, birthDate: input.birthDate }];
  });
  const candidates = await rostersService.candidates(registrationId, 'Ana');
  assert.equal(candidates[0].eligible, true);
  assert.equal(candidates[1].eligible, false);
  assert.equal(candidates[0].documentMasked, '***5678');
  assert.equal('birthDate' in candidates[0], false);
  assert.equal('documentNumber' in candidates[0], false);
});

test('previous roster selection stays within the destination adult or youth section', async (t) => {
  const state = setup(t);
  state.registration.competition = { ...state.competition, ageGroup: 'YOUTH' };
  const find = stub(t, prisma.teamRegistration, 'findMany', async ({ where }) => {
    assert.equal(where.competition.ageGroup, 'YOUTH');
    assert.equal(where.teamId, 'club');
    return [];
  });
  assert.equal(await rostersService.previous(registrationId), null);
  assert.equal(find.mock.callCount(), 1);
});

test('player sections follow active memberships rather than an assumed adult birthday threshold', async (t) => {
  const lookup = stub(t, prisma.player, 'findMany', async () => []);
  await playersService.list('Ana', 'youth-club', 'YOUTH');
  const query = lookup.mock.calls[0].arguments[0];
  assert.deepEqual(query.where.AND[0].rosterEntries.some, {
    status: 'ACTIVE', teamRegistration: { teamId: 'youth-club', competition: { ageGroup: 'YOUTH' } },
  });
  assert.equal(query.where.birthDate, undefined);
  await playersService.list('Ana', undefined, 'ADULT');
  assert.deepEqual(lookup.mock.calls[1].arguments[0].where.AND[0].rosterEntries.some.teamRegistration, { competition: { ageGroup: 'ADULT' } });
});
