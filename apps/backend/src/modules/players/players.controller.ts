import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { playersService } from './players.service';

export const playersController = {
  list: asyncHandler(async (req, res) =>
    ok(res, await playersService.list(req.query.search as string | undefined)),
  ),
  byDocument: asyncHandler(async (req, res) =>
    ok(res, await playersService.byDocument(req.query.type as 'CEDULA' | 'PARTIDA', req.query.number as string)),
  ),
  get: asyncHandler(async (req, res) => ok(res, await playersService.get(req.params.id))),
  create: asyncHandler(async (req, res) => created(res, await playersService.create(req.body))),
  update: asyncHandler(async (req, res) =>
    ok(res, await playersService.update(req.params.id, req.body)),
  ),
  setStatus: asyncHandler(async (req, res) =>
    ok(res, await playersService.setStatus(req.params.id, req.body.status)),
  ),
  setDegree: asyncHandler(async (req, res) =>
    ok(res, await playersService.setDegree(req.params.id, req.body)),
  ),
  competitions: asyncHandler(async (req, res) =>
    ok(res, await playersService.competitions(req.params.id)),
  ),
};
