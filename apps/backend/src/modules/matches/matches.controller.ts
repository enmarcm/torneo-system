import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { matchesService } from './matches.service';

export const matchesController = {
  list: asyncHandler(async (req, res) =>
    ok(
      res,
      await matchesService.list({
        competitionId: req.query.competitionId as string | undefined,
        status: req.query.status as string | undefined,
        editionId: req.query.editionId as string | undefined,
        // Programación de una jornada concreta ('today' o YYYY-MM-DD), que es
        // como el panel pide el día sin filtrar por competición.
        day: req.query.day as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) || undefined : undefined,
      }),
    ),
  ),
  get: asyncHandler(async (req, res) => ok(res, await matchesService.get(req.params.id))),
  create: asyncHandler(async (req, res) => created(res, await matchesService.create(req.body))),
  update: asyncHandler(async (req, res) =>
    ok(res, await matchesService.update(req.params.id, req.body)),
  ),
  start: asyncHandler(async (req, res) => ok(res, await matchesService.start(req.params.id))),
  finish: asyncHandler(async (req, res) => ok(res, await matchesService.finish(req.params.id))),
  setMvp: asyncHandler(async (req, res) =>
    ok(res, await matchesService.setMvp(req.params.id, req.body), 'MVP designado'),
  ),
  clearMvp: asyncHandler(async (req, res) =>
    ok(res, await matchesService.clearMvp(req.params.id), 'MVP quitado'),
  ),
  remove: asyncHandler(async (req, res) =>
    ok(res, await matchesService.remove(req.params.id), 'Eliminado'),
  ),
};
