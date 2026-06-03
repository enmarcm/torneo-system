import { asyncHandler } from '@/utils/async-handler';
import { ok } from '@/utils/http.util';
import { statsService } from './stats.service';

export const statsController = {
  players: asyncHandler(async (req, res) =>
    ok(
      res,
      await statsService.players({
        competitionId: req.query.competitionId as string | undefined,
        teamId: req.query.teamId as string | undefined,
        playerId: req.query.playerId as string | undefined,
      }),
    ),
  ),
};
