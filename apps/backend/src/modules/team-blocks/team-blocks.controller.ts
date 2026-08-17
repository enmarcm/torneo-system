import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { teamBlocksService } from './team-blocks.service';

export const teamBlocksController = {
  list: asyncHandler(async (req, res) =>
    ok(
      res,
      await teamBlocksService.list({
        teamId: req.query.teamId as string | undefined,
        competitionId: req.query.competitionId as string | undefined,
        active: req.query.active === undefined ? undefined : req.query.active === 'true',
      }),
    ),
  ),
  forTeam: asyncHandler(async (req, res) =>
    ok(res, await teamBlocksService.forTeam(req.params.teamId)),
  ),
  create: asyncHandler(async (req, res) =>
    created(res, await teamBlocksService.create(req.body, req.user?.id), 'Equipo bloqueado'),
  ),
  lift: asyncHandler(async (req, res) =>
    ok(
      res,
      await teamBlocksService.lift(req.params.id, req.body.liftReason, req.user?.id),
      'Bloqueo levantado',
    ),
  ),
};
