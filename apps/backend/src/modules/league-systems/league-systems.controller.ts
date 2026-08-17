import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { leagueSystemsService } from './league-systems.service';

export const leagueSystemsController = {
  list: asyncHandler(async (req, res) =>
    ok(res, await leagueSystemsService.list(req.query.editionId as string | undefined)),
  ),
  get: asyncHandler(async (req, res) => ok(res, await leagueSystemsService.get(req.params.id))),
  create: asyncHandler(async (req, res) =>
    created(res, await leagueSystemsService.create(req.body)),
  ),
  update: asyncHandler(async (req, res) =>
    ok(res, await leagueSystemsService.update(req.params.id, req.body)),
  ),
  attachDivision: asyncHandler(async (req, res) =>
    ok(
      res,
      await leagueSystemsService.attachDivision(
        req.params.id,
        req.body.competitionId,
        req.body.divisionLevel,
      ),
      'División enlazada',
    ),
  ),
  attachCup: asyncHandler(async (req, res) =>
    ok(res, await leagueSystemsService.attachCup(req.params.id, req.body.competitionId), 'Copa enlazada'),
  ),
  detach: asyncHandler(async (req, res) =>
    ok(res, await leagueSystemsService.detach(req.params.competitionId), 'Desenlazada'),
  ),
  eligibleForCup: asyncHandler(async (req, res) =>
    ok(res, await leagueSystemsService.eligibleForCup(req.params.id)),
  ),
};
