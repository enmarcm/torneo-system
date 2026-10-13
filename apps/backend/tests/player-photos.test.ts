import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import express, { type ErrorRequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import { ZodError } from 'zod';
import { prisma } from '../src/lib/prisma';
import { minioClient } from '../src/lib/minio';
import { env } from '../src/config/env';
import { AppError } from '../src/utils/app-error';
import { createPlayerSchema, updatePlayerSchema } from '../src/modules/players/players.schema';
import { createRosterPlayerSchema } from '../src/modules/rosters/rosters.schema';
import { validatePlayerPhotos, assertIdentityPhotoOwner } from '../src/modules/players/player-photos';
import { rostersService } from '../src/modules/rosters/rosters.service';
import { uploadsRouter } from '../src/modules/uploads/uploads.routes';

const stub = (t: TestContext, target: object, method: string, implementation: (...args: any[]) => any) => {
  const original = Reflect.get(target, method); const mock = t.mock.fn(implementation);
  Reflect.set(target, method, mock); t.after(() => { Reflect.set(target, method, original); }); return mock;
};
const actorId = '11111111-1111-4111-8111-111111111111';
const key = `identity/${actorId}/22222222-2222-4222-8222-222222222222.webp`;
const profile = { documentType: 'CEDULA', documentNumber: '12345678', firstName: 'Ana', lastName: 'Perez', birthDate: '2000-01-01', photoUrl: 'https://assets.example.test/avatar.webp', identityPhotoKey: key };

test('both images are mandatory on player and roster creation, and cannot be cleared by partial updates', () => {
  assert.equal(createPlayerSchema.safeParse(profile).success, true);
  assert.equal(createRosterPlayerSchema.safeParse(profile).success, true);
  for (const schema of [createPlayerSchema, createRosterPlayerSchema]) {
    assert.equal(schema.safeParse({ ...profile, photoUrl: undefined }).success, false);
    assert.equal(schema.safeParse({ ...profile, identityPhotoKey: undefined }).success, false);
    assert.equal(schema.safeParse({ ...profile, photoUrl: '' }).success, false);
    assert.equal(schema.safeParse({ ...profile, identityPhotoKey: 'https://public.example.test/document.jpg' }).success, false);
  }
  assert.equal(updatePlayerSchema.safeParse({ photoUrl: null }).success, false);
  assert.equal(updatePlayerSchema.safeParse({ identityPhotoKey: '' }).success, false);
});

test('missing photos and missing stored identity images are rejected', async (t) => {
  const storage = stub(t, minioClient, 'statObject', async () => { throw new Error('missing'); });
  await assert.rejects(validatePlayerPhotos({ photoUrl: profile.photoUrl }), { code: 'PLAYER_PHOTOS_REQUIRED' });
  assert.equal(storage.mock.callCount(), 0);
  await assert.rejects(validatePlayerPhotos(profile), { code: 'IDENTITY_PHOTO_MISSING' });
  assert.equal(storage.mock.calls[0].arguments[0], env.MINIO_PRIVATE_BUCKET);
});

test('delegates cannot attach another uploader identity key to a new profile', () => {
  const owner = { id: actorId, role: 'TEAM_LEADER' };
  assert.doesNotThrow(() => assertIdentityPhotoOwner(owner, key));
  assert.throws(() => assertIdentityPhotoOwner({ id: 'different-user', role: 'TEAM_LEADER' }, key), { code: 'FORBIDDEN' });
  assert.doesNotThrow(() => assertIdentityPhotoOwner({ id: 'different-user', role: 'TEAM_LEADER' }, key, key));
  assert.doesNotThrow(() => assertIdentityPhotoOwner({ id: 'admin', role: 'ADMIN' }, key));
});

test('legacy players missing a photo cannot be added to a new tournament roster', async (t) => {
  stub(t, prisma, '$transaction', async (work) => work(prisma));
  stub(t, prisma.player, 'findUnique', async () => ({ id: 'legacy', status: 'ACTIVE', birthDate: new Date('2000-01-01'), photoUrl: profile.photoUrl, identityPhotoKey: null }));
  const create = stub(t, prisma.rosterEntry, 'create', async () => ({}));
  await assert.rejects(rostersService.add('registration', 'legacy'), { code: 'PLAYER_PHOTOS_REQUIRED' });
  assert.equal(create.mock.callCount(), 0);
});

test('identity uploads use private storage and the authenticated image route enforces ownership', async (t) => {
  let role = 'TEAM_LEADER';
  let linkedTeam: string | null = null;
  stub(t, prisma.user, 'findUnique', async () => ({ id: actorId, role, status: 'ACTIVE', teamId: 'club', updatedAt: new Date(0) }));
  stub(t, prisma.player, 'findFirst', async () => linkedTeam ? { rosterEntries: [{ teamRegistration: { teamId: linkedTeam } }] } : null);
  const image = await sharp({ create: { width: 2, height: 2, channels: 3, background: { r: 0, g: 0, b: 0 } } }).png().toBuffer();
  const put = stub(t, minioClient, 'putObject', async () => ({}));
  const get = stub(t, minioClient, 'getObject', async () => Readable.from(image));
  const app = express(); app.use('/uploads', uploadsRouter);
  const errors: ErrorRequestHandler = (error, _req, res, _next) => { res.status(error instanceof AppError ? error.statusCode : error instanceof ZodError ? 422 : 500).json({ message: error.message }); };
  app.use(errors);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.on('listening', resolve));
  t.after(() => new Promise<void>((resolve) => { server.closeAllConnections(); server.close(() => resolve()); }));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/uploads`;
  const token = jwt.sign({ id: actorId }, env.JWT_ACCESS_SECRET, { algorithm: 'HS256', expiresIn: '1m' });
  const headers = { Authorization: `Bearer ${token}` };
  const form = new FormData(); form.append('file', new Blob([new Uint8Array(image)], { type: 'image/png' }), 'id.png');
  const uploaded = await fetch(`${base}/identity`, { method: 'POST', headers, body: form });
  assert.equal(uploaded.status, 200);
  const payload = await uploaded.json() as any;
  assert.ok(payload.data.key.startsWith(`identity/${actorId}/`));
  assert.equal('url' in payload.data, false);
  assert.equal(put.mock.calls[0].arguments[0], env.MINIO_PRIVATE_BUCKET);
  assert.equal(put.mock.calls[0].arguments[4]['Content-Type'], 'image/webp');
  const corrupt = new FormData(); corrupt.append('file', new Blob(['not-an-image'], { type: 'image/png' }), 'invalid.png');
  assert.equal((await fetch(`${base}/identity`, { method: 'POST', headers, body: corrupt })).status, 415);
  assert.equal(put.mock.callCount(), 1);
  const url = `${base}/identity/${encodeURIComponent(key)}/image`;
  let response = await fetch(url, { headers });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  await response.arrayBuffer();
  linkedTeam = 'other-club';
  assert.equal((await fetch(url, { headers })).status, 403);
  linkedTeam = 'club';
  response = await fetch(url, { headers }); assert.equal(response.status, 200); await response.arrayBuffer();
  role = 'ADMIN';
  linkedTeam = 'other-club';
  response = await fetch(url, { headers }); assert.equal(response.status, 200); await response.arrayBuffer();
  role = 'SCOREKEEPER'; assert.equal((await fetch(url, { headers })).status, 403);
  role = 'COMMUNITY_MANAGER'; assert.equal((await fetch(url, { headers })).status, 403);
  assert.equal((await fetch(url)).status, 401);
  assert.equal(get.mock.callCount(), 3);
});
