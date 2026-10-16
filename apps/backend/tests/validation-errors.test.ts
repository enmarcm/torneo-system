import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { z } from 'zod';
import { errorMiddleware } from '../src/middlewares/error.middleware';
import { validate } from '../src/middlewares/validate.middleware';
import { createUserSchema, updateUserPasswordSchema } from '../src/modules/users/users.schema';
import { changePasswordSchema } from '../src/modules/auth/auth.schema';
import { createTeamSchema } from '../src/modules/teams/teams.schema';
import { formatValidationErrors } from '../src/utils/validation-errors';

test('all password creation and change paths accept six characters without composition requirements', () => {
  const validatePasswords = (password: string) => [
    createUserSchema.safeParse({ username: 'delegado', password }).success,
    createTeamSchema.safeParse({ name: 'Equipo', leaderUsername: 'delegado', leaderPassword: password }).success,
    updateUserPasswordSchema.safeParse({ password }).success,
    changePasswordSchema.safeParse({ currentPassword: 'anterior', newPassword: password }).success,
  ];
  for (const password of ['abcdef', '123456', '!!!!!!', 'ABCDEF', 'clave sencilla']) {
    assert.deepEqual(validatePasswords(password), [true, true, true, true]);
  }
  for (const password of ['', 'abcde', '12345']) {
    assert.deepEqual(validatePasswords(password), [false, false, false, false]);
  }
});

test('short passwords return a named Spanish HTTP validation error', async () => {
  const app = express();
  app.use(express.json());
  app.post('/users', validate(createUserSchema), (_req, res) => res.sendStatus(201));
  app.post('/teams', validate(createTeamSchema), (_req, res) => res.sendStatus(201));
  app.use(errorMiddleware);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  try {
    for (const [path, input, field, label] of [
      ['/users', { username: 'delegado', password: 'corta' }, 'password', 'Contraseña'],
      ['/teams', { name: 'Equipo', leaderUsername: 'delegado', leaderPassword: 'corta' }, 'leaderPassword', 'Contraseña del delegado'],
    ] as const) {
      const response = await fetch(`http://127.0.0.1:${address.port}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      assert.equal(response.status, 422);
      const payload = await response.json() as any;
      assert.equal(payload.code, 'VALIDATION');
      assert.equal(payload.message, `${label}: Mínimo 6 caracteres`);
      assert.deepEqual(payload.fields[field], ['Mínimo 6 caracteres']);
      assert.equal(payload.errors[0].field, field);
      assert.equal(JSON.stringify(payload).includes('corta'), false);
    }
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('shows required fields, multiple issues and custom messages without submitted values', () => {
  const result = createUserSchema.safeParse({ username: 'ab', email: 'correo-mal' });
  assert.equal(result.success, false);
  if (result.success) return;
  const payload = formatValidationErrors(result.error);
  assert.match(payload.message, /Usuario: Mínimo 3 caracteres/);
  assert.match(payload.message, /Contraseña: Este campo es obligatorio/);
  const nested = z.object({ players: z.array(z.object({ photoUrl: z.string().url('Sube la foto del jugador') })) }).safeParse({ players: [{ photoUrl: '' }] });
  assert.equal(nested.success, false);
  if (!nested.success) assert.deepEqual(formatValidationErrors(nested.error).errors[0], { field: 'players.0.photoUrl', message: 'Foto del jugador: Sube la foto del jugador' });
});
