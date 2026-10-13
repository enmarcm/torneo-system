import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { initSocket } from '../src/lib/socket';
import { matchesService } from '../src/modules/matches/matches.service';
import express, { type ErrorRequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/lib/prisma';
import { env } from '../src/config/env';
import { AppError } from '../src/utils/app-error';
import { ZodError } from 'zod';
import { attendanceService } from '../src/modules/matches/attendance.service';
import { setAttendanceSchema } from '../src/modules/matches/matches.schema';
import { matchesRouter } from '../src/modules/matches/matches.routes';

const stub = (t: TestContext, delegate: object, method: string, implementation: (...args: any[]) => any) => {
  const original = Reflect.get(delegate, method);
  const mocked = t.mock.fn(implementation);
  Reflect.set(delegate, method, mocked);
  t.after(() => { Reflect.set(delegate, method, original); });
  return mocked;
};
const homeId = '11111111-1111-4111-8111-111111111111';
const awayId = '22222222-2222-4222-8222-222222222222';

const setup = (t: TestContext) => {
  const saved = new Map<string, boolean>();
  const match = { id: 'match', competitionId: 'tournament', attendanceUpdatedAt: null as Date | null,
    homeRegistration: { id: 'home', team: { id: 'home-club', name: 'Local' } },
    awayRegistration: { id: 'away', team: { id: 'away-club', name: 'Visitante' } },
  };
  stub(t, prisma, '$transaction', async (callback) => callback(prisma));
  stub(t, prisma.match, 'findUnique', async () => match);
  stub(t, prisma.match, 'update', async ({ data }) => { match.attendanceUpdatedAt = data.attendanceUpdatedAt; return match; });
  const roster = stub(t, prisma.rosterEntry, 'findMany', async () => [
    { id: homeId, teamRegistrationId: 'home', jerseyNumber: 9, status: 'ACTIVE', player: { id: 'p1', firstName: 'Ana', lastName: 'A', photoUrl: null, status: 'ACTIVE' }, matchAttendances: saved.has(homeId) ? [{ present: saved.get(homeId) }] : [] },
    { id: awayId, teamRegistrationId: 'away', jerseyNumber: null, status: 'ACTIVE', player: { id: 'p2', firstName: 'Luis', lastName: 'B', photoUrl: null, status: 'ACTIVE' }, matchAttendances: saved.has(awayId) ? [{ present: saved.get(awayId) }] : [] },
  ]);
  const create = stub(t, prisma.matchAttendance, 'createMany', async ({ data }) => {
    for (const row of data) if (!saved.has(row.rosterEntryId)) saved.set(row.rosterEntryId, row.present);
    return { count: data.length };
  });
  stub(t, prisma.matchAttendance, 'updateMany', async ({ where, data }) => {
    assert.equal(where.matchId, 'match');
    for (const id of where.rosterEntryId.in) saved.set(id, data.present);
    return { count: where.rosterEntryId.in.length };
  });
  return { saved, roster, create };
};

test('attendance is scoped to both teams and this tournament, with unmarked initial values', async (t) => {
  const { roster } = setup(t);
  const sheet = await attendanceService.get('match');
  assert.equal(sheet.teams.length, 2);
  assert.equal(sheet.teams[0].players[0].present, null);
  assert.equal(sheet.teams[1].players[0].present, null);
  const where = roster.mock.calls[0].arguments[0].where;
  assert.deepEqual(where.teamRegistrationId, { in: ['home', 'away'] });
  assert.deepEqual(where.teamRegistration, { competitionId: 'tournament' });
});

test('present and absent values persist and editing does not duplicate attendance', async (t) => {
  const { saved } = setup(t);
  const first = await attendanceService.save('match', { entries: [{ rosterEntryId: homeId, present: true }, { rosterEntryId: awayId, present: false }] });
  assert.equal(first.teams[0].players[0].present, true);
  assert.equal(first.teams[1].players[0].present, false);
  assert.ok(first.updatedAt instanceof Date);
  await attendanceService.save('match', { entries: [{ rosterEntryId: homeId, present: false }] });
  assert.equal(saved.size, 2);
  assert.equal(saved.get(homeId), false);
  assert.equal(saved.get(awayId), false);
});

test('a player outside this match cannot be marked, even with a forged roster ID', async (t) => {
  const { create } = setup(t);
  await assert.rejects(attendanceService.save('match', { entries: [{ rosterEntryId: 'other-tournament-roster', present: true }] }), { code: 'ATTENDANCE_NOT_IN_MATCH' });
  assert.equal(create.mock.callCount(), 0);
});

test('duplicate roster entries and malformed statuses are rejected', async (t) => {
  const { create } = setup(t);
  const entries = [{ rosterEntryId: homeId, present: true }, { rosterEntryId: homeId, present: false }];
  assert.equal(setAttendanceSchema.safeParse({ entries }).success, false);
  assert.equal(setAttendanceSchema.safeParse({ entries: [{ rosterEntryId: homeId, present: 'yes' }] }).success, false);
  assert.equal(setAttendanceSchema.safeParse({ entries: [{ rosterEntryId: homeId, present: true, playerId: 'forged' }] }).success, false);
  await assert.rejects(attendanceService.save('match', { entries }), { code: 'DUPLICATE_ATTENDANCE' });
  assert.equal(create.mock.callCount(), 0);
});

test('missing matches return 404 without writing attendance', async (t) => {
  stub(t, prisma, '$transaction', async (callback) => callback(prisma));
  stub(t, prisma.match, 'findUnique', async () => null);
  await assert.rejects(attendanceService.get('missing'), { code: 'NOT_FOUND' });
  await assert.rejects(attendanceService.save('missing', { entries: [] }), { code: 'NOT_FOUND' });
});

test('HTTP routes permit administrator and scorekeeper and deny other roles', async (t) => {
  let role = 'ADMIN';
  stub(t, prisma.user, 'findUnique', async () => ({ id: 'staff', role, status: 'ACTIVE', updatedAt: new Date(0), teamId: null }));
  stub(t, prisma.auditLog, 'create', async () => ({}));
  stub(t, attendanceService, 'get', async () => ({ matchId: 'match', teams: [] }));
  stub(t, attendanceService, 'save', async () => ({ matchId: 'match', teams: [] }));
  const app = express();
  app.use(express.json());
  app.use('/matches', matchesRouter);
  const errors: ErrorRequestHandler = (err, _req, res, _next) => {
    res.status(err instanceof AppError ? err.statusCode : err instanceof ZodError ? 422 : 500).json({ message: err.message });
  };
  app.use(errors);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.on('listening', resolve));
  t.after(() => new Promise<void>((resolve) => { server.closeAllConnections(); server.close(() => resolve()); }));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}/matches/match/attendance`;
  const token = jwt.sign({ id: 'staff' }, env.JWT_ACCESS_SECRET, { algorithm: 'HS256', expiresIn: '1m' });
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  for (const nextRole of ['ADMIN', 'SCOREKEEPER', 'COMMUNITY_MANAGER', 'TEAM_LEADER']) {
    role = nextRole;
    const expected = ['ADMIN', 'SCOREKEEPER'].includes(role) ? 200 : 403;
    assert.equal((await fetch(url, { headers })).status, expected);
    assert.equal((await fetch(url, { method: 'PUT', headers, body: JSON.stringify({ entries: [] }) })).status, expected);
  }
  assert.equal((await fetch(url)).status, 401);
  assert.equal((await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries: [] }) })).status, 401);
  role = 'SCOREKEEPER';
  assert.equal((await fetch(url, { method: 'PUT', headers, body: JSON.stringify({ entries: [{ rosterEntryId: homeId, present: 'yes' }] }) })).status, 422);
});


test('changing teams resets attendance while rescheduling preserves it', async (t) => {
  const io = initSocket(createServer());
  t.after(() => new Promise<void>((resolve) => io.close(() => resolve())));
  const current = { id: 'match', competitionId: 'tournament', homeRegistrationId: 'home', awayRegistrationId: 'away', status: 'SCHEDULED', homeScore: 0, awayScore: 0 };
  stub(t, prisma, '$transaction', async (callback) => callback(prisma));
  stub(t, prisma.match, 'findUnique', async () => current);
  const update = stub(t, prisma.match, 'update', async ({ data }) => ({ ...current, ...data }));
  const remove = stub(t, prisma.matchAttendance, 'deleteMany', async () => ({ count: 2 }));
  await matchesService.update('match', { scheduledAt: new Date() });
  assert.equal(remove.mock.callCount(), 0);
  assert.equal('attendanceUpdatedAt' in update.mock.calls[0].arguments[0].data, false);
  await matchesService.update('match', { awayRegistrationId: 'new-away' });
  assert.equal(remove.mock.callCount(), 1);
  assert.deepEqual(remove.mock.calls[0].arguments[0].where, { matchId: 'match' });
  assert.equal(update.mock.calls[1].arguments[0].data.attendanceUpdatedAt, null);
});
