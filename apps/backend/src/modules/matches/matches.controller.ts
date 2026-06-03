import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { matchesService } from './matches.service';

export const matchesController = {
  list: asyncHandler(async (req, res) =>
    ok(
      res,
      await matchesService.list(
        req.query.competitionId as string | undefined,
        req.query.status as string | undefined,
      ),
    ),
  ),
  get: asyncHandler(async (req, res) => ok(res, await matchesService.get(req.params.id))),
  create: asyncHandler(async (req, res) => created(res, await matchesService.create(req.body))),
  update: asyncHandler(async (req, res) =>
    ok(res, await matchesService.update(req.params.id, req.body)),
  ),
  start: asyncHandler(async (req, res) => ok(res, await matchesService.start(req.params.id))),
  finish: asyncHandler(async (req, res) => ok(res, await matchesService.finish(req.params.id))),
  remove: asyncHandler(async (req, res) =>
    ok(res, await matchesService.remove(req.params.id), 'Eliminado'),
  ),
};
