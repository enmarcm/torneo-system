import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { usersService } from './users.service';

export const usersController = {
  list: asyncHandler(async (_req, res) => ok(res, await usersService.list())),
  create: asyncHandler(async (req, res) => created(res, await usersService.create(req.body))),
  setStatus: asyncHandler(async (req, res) =>
    ok(res, await usersService.setStatus(req.params.id, req.body.status)),
  ),
  remove: asyncHandler(async (req, res) => ok(res, await usersService.remove(req.params.id), 'Eliminado')),
};
