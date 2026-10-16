import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { prisma } from '../src/lib/prisma';
import { publicRouter } from '../src/modules/public/public.routes';
import { errorMiddleware } from '../src/middlewares/error.middleware';

test('public rosters use the selected registration, omit private player fields and validate access', async (t) => {
  const registrationA = '11111111-1111-4111-8111-111111111111';
  const registrationB = '22222222-2222-4222-8222-222222222222';
  const inactive = '33333333-3333-4333-8333-333333333333';
  const missing = '44444444-4444-4444-8444-444444444444';
  const entry = (id: string) => ({ id, jerseyNumber: 0, player: { id: `player-${id}`, firstName: id, lastName: 'Jugador', photoUrl: null, position: null }, stats: null });
  const original = prisma.teamRegistration.findUnique;
  const lookup = t.mock.fn(async (query: any) => {
    assert.deepEqual(query.select.roster.where, { status: 'ACTIVE', player: { status: 'ACTIVE' } });
    assert.deepEqual(Object.keys(query.select.roster.select.player.select).sort(), ['firstName', 'id', 'lastName', 'photoUrl', 'position']);
    if (query.where.id === missing) return null;
    return { status: query.where.id === inactive ? 'INACTIVE' : 'ACTIVE', roster: [entry(query.where.id)] };
  });
  Reflect.set(prisma.teamRegistration, 'findUnique', lookup);
  t.after(() => { Reflect.set(prisma.teamRegistration, 'findUnique', original); });
  const app = express();
  app.use('/public', publicRouter);
  app.use(errorMiddleware);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/public/registrations`;
  try {
    for (const registration of [registrationA, registrationB]) {
      const response = await fetch(`${base}/${registration}/roster`);
      assert.equal(response.status, 200);
      const payload = await response.json() as { data: unknown };
      assert.deepEqual(payload.data, [entry(registration)]);
    }
    assert.equal((await fetch(`${base}/${inactive}/roster`)).status, 404);
    assert.equal((await fetch(`${base}/${missing}/roster`)).status, 404);
    const calls = lookup.mock.callCount();
    assert.equal((await fetch(`${base}/invalid/roster`)).status, 422);
    assert.equal(lookup.mock.callCount(), calls);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
