import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { fixturesService } from './fixtures.service';

export const fixturesController = {
  generateLeague: asyncHandler(async (req, res) =>
    created(
      res,
      await fixturesService.generateLeague(req.params.competitionId),
      'Calendario sorteado. Asigná día y hora a cada partido.',
    ),
  ),
  generateGroupStage: asyncHandler(async (req, res) =>
    created(
      res,
      await fixturesService.generateGroupStage(req.params.competitionId),
      'Grupos sorteados. Asigná día y hora a cada partido.',
    ),
  ),
  clear: asyncHandler(async (req, res) =>
    ok(res, await fixturesService.clear(req.params.competitionId, req.body.stage), 'Calendario borrado'),
  ),
  schedule: asyncHandler(async (req, res) =>
    ok(
      res,
      await fixturesService.schedule(
        req.params.matchId,
        req.body.scheduledAt ? new Date(req.body.scheduledAt) : null,
        req.body.venue,
      ),
      'Partido programado',
    ),
  ),
  scheduleBulk: asyncHandler(async (req, res) =>
    ok(res, await fixturesService.scheduleBulk(req.body.items), 'Partidos programados'),
  ),
};
