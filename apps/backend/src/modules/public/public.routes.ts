import { Router } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { ok } from '@/utils/http.util';
import { editionsService } from '@/modules/editions/editions.service';
import { competitionsService } from '@/modules/competitions/competitions.service';
import { teamsService } from '@/modules/teams/teams.service';
import { playersService } from '@/modules/players/players.service';
import { matchesService } from '@/modules/matches/matches.service';
import { standingsService } from '@/modules/standings/standings.service';
import { statsService } from '@/modules/stats/stats.service';
import { adsService } from '@/modules/ads/ads.service';

export const publicRouter = Router();

publicRouter.get('/editions', asyncHandler(async (_req, res) => ok(res, await editionsService.list())));
publicRouter.get('/competitions', asyncHandler(async (req, res) =>
  ok(res, await competitionsService.list(req.query.editionId as string | undefined)),
));
publicRouter.get('/teams', asyncHandler(async (_req, res) => ok(res, await teamsService.list())));
publicRouter.get('/players', asyncHandler(async (req, res) =>
  ok(res, await playersService.list(req.query.search as string | undefined)),
));
publicRouter.get('/matches', asyncHandler(async (req, res) =>
  ok(res, await matchesService.list(
    req.query.competitionId as string | undefined,
    req.query.status as string | undefined,
  )),
));
publicRouter.get('/standings', asyncHandler(async (req, res) =>
  ok(res, await standingsService.byCompetition(
    req.query.competitionId as string,
    req.query.groupId as string | undefined,
  )),
));
publicRouter.get('/stats', asyncHandler(async (req, res) =>
  ok(res, await statsService.players({ competitionId: req.query.competitionId as string | undefined })),
));
publicRouter.get('/ads', asyncHandler(async (req, res) =>
  ok(res, await adsService.list(req.query.placement as string | undefined)),
));
