import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { knockoutService } from './knockout.service';

export const knockoutController = {
  bracket: asyncHandler(async (req, res) =>
    ok(res, await knockoutService.bracket(req.params.competitionId)),
  ),
  generate: asyncHandler(async (req, res) =>
    created(res, await knockoutService.generate(req.params.competitionId), 'Cuadro generado'),
  ),
  seedFromGroups: asyncHandler(async (req, res) =>
    ok(res, await knockoutService.seedFromGroups(req.params.competitionId), 'Clasificados ubicados'),
  ),
  setTeams: asyncHandler(async (req, res) =>
    ok(
      res,
      await knockoutService.setTeams(
        req.params.id,
        req.body.homeRegistrationId,
        req.body.awayRegistrationId,
      ),
    ),
  ),
  createMatches: asyncHandler(async (req, res) =>
    created(res, await knockoutService.createMatches(req.params.id), 'Partidos creados'),
  ),
  resolve: asyncHandler(async (req, res) =>
    ok(res, await knockoutService.resolve(req.params.id), 'Llave resuelta'),
  ),
  setWinner: asyncHandler(async (req, res) =>
    ok(res, await knockoutService.setWinner(req.params.id, req.body.winnerRegistrationId)),
  ),
};
