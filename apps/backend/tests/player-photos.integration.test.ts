import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { minioClient } from '../src/lib/minio';
import { env } from '../src/config/env';

// Opt-in: requires migrated PostgreSQL, seeded admin and real MinIO buckets.
test('real storage uploads, private reads and player persistence', { skip: process.env.RUN_STORAGE_INTEGRATION !== '1' }, async () => {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/api`;
  let playerId: string | undefined;
  let photoKey: string | undefined;
  let identityKey: string | undefined;
  try {
    const login = await fetch(`${base}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: process.env.ADMIN_USERNAME || 'admin', password: env.ADMIN_PASSWORD }),
    });
    assert.equal(login.status, 200);
    const { data: session } = await login.json() as any;
    const headers = { Authorization: `Bearer ${session.accessToken}` };
    const image = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#eeeeee' } }).png().toBuffer();
    const upload = async (route: string) => {
      const form = new FormData();
      form.append('file', new Blob([new Uint8Array(image)], { type: 'image/png' }), 'synthetic-test.png');
      const response = await fetch(`${base}/uploads/${route}`, { method: 'POST', headers, body: form });
      assert.equal(response.status, 200);
      return (await response.json() as any).data;
    };
    const photo = await upload('image'); photoKey = photo.key;
    const identity = await upload('identity'); identityKey = identity.key;
    assert.equal(identity.url, undefined);
    const privatePath = `${base}/uploads/identity/${encodeURIComponent(identity.key)}/image`;
    assert.equal((await fetch(privatePath)).status, 401);
    const privateRead = await fetch(privatePath, { headers });
    assert.equal(privateRead.status, 200);
    assert.equal(privateRead.headers.get('cache-control'), 'private, no-store');
    assert.equal((await sharp(Buffer.from(await privateRead.arrayBuffer())).metadata()).format, 'webp');
    const anonymousMinio = await fetch(`http://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${env.MINIO_PRIVATE_BUCKET}/${identity.key}`);
    assert.equal(anonymousMinio.status, 403);
    const publicPhoto = await fetch(photo.url);
    assert.equal(publicPhoto.status, 200);
    await publicPhoto.arrayBuffer();
    const profile = { documentType: 'CEDULA', documentNumber: `TEST-${randomUUID()}`, firstName: 'Prueba', lastName: 'Temporal', birthDate: '2000-01-01', photoUrl: photo.url, identityPhotoKey: identity.key };
    const save = (body: object) => fetch(`${base}/players`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal((await save({ ...profile, identityPhotoKey: undefined })).status, 422);
    assert.equal((await save({ ...profile, photoUrl: undefined })).status, 422);
    const saved = await save(profile);
    assert.equal(saved.status, 201);
    playerId = (await saved.json() as any).data.id;
    const stored = await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
    assert.equal(stored.identityPhotoKey, identity.key);
    assert.equal(stored.photoUrl, photo.url);
    assert.equal((await fetch(privatePath, { headers })).status, 200);
  } finally {
    if (playerId) await prisma.player.delete({ where: { id: playerId } });
    if (identityKey) await minioClient.removeObject(env.MINIO_PRIVATE_BUCKET, identityKey);
    if (photoKey) await minioClient.removeObject(env.MINIO_PUBLIC_BUCKET, photoKey);
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await prisma.$disconnect();
  }
});
