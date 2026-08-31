import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { usersService } from './users.service';
import type { UserRole } from '@/config/roles';

export const usersController = {
  list: asyncHandler(async (req, res) => {
    const { role, q } = req.query as { role?: UserRole; q?: string };
    ok(res, await usersService.list({ role, q }));
  }),
  get: asyncHandler(async (req, res) => ok(res, await usersService.get(req.params.id))),
  create: asyncHandler(async (req, res) => created(res, await usersService.create(req.body))),
  update: asyncHandler(async (req, res) =>
    ok(res, await usersService.update(req.user!.id, req.params.id, req.body), 'Usuario actualizado'),
  ),
  setPassword: asyncHandler(async (req, res) =>
    ok(res, await usersService.setPassword(req.params.id, req.body.password), 'Contraseña actualizada'),
  ),
  setStatus: asyncHandler(async (req, res) =>
    ok(res, await usersService.setStatus(req.user!.id, req.params.id, req.body.status)),
  ),
  remove: asyncHandler(async (req, res) =>
    ok(res, await usersService.remove(req.user!.id, req.params.id), 'Eliminado'),
  ),
};
