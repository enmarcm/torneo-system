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
import { groupsService } from '@/modules/groups/groups.service';
import { knockoutService } from '@/modules/knockout/knockout.service';
import { leagueSystemsService } from '@/modules/league-systems/league-systems.service';

export const publicRouter = Router();

publicRouter.get('/editions', asyncHandler(async (_req, res) => ok(res, await editionsService.list())));
publicRouter.get('/competitions', asyncHandler(async (req, res) =>
  ok(res, await competitionsService.list(req.query.editionId as string | undefined)),
));
publicRouter.get('/teams', asyncHandler(async (_req, res) => ok(res, await teamsService.list())));
publicRouter.get('/players', asyncHandler(async (req, res) =>
  ok(res, await playersService.list(req.query.search as string | undefined)),
));
publicRouter.get('/registrations', asyncHandler(async (req, res) =>
  ok(res, await competitionsService.registrations({
    editionId: req.query.editionId as string | undefined,
    competitionId: req.query.competitionId as string | undefined,
  })),
));
// El calendario público muestra todas las competiciones de la edición a la vez,
// así que necesita un tope más alto que el de las pantallas de administración.
const PUBLIC_MATCHES_LIMIT = 500;
publicRouter.get('/matches', asyncHandler(async (req, res) =>
  ok(res, await matchesService.list({
    competitionId: req.query.competitionId as string | undefined,
    status: req.query.status as string | undefined,
    editionId: req.query.editionId as string | undefined,
    limit: PUBLIC_MATCHES_LIMIT,
  })),
));
publicRouter.get('/standings', asyncHandler(async (req, res) =>
  ok(res, await standingsService.byCompetition(
    req.query.competitionId as string,
    req.query.groupId as string | undefined,
  )),
));
publicRouter.get('/stats', asyncHandler(async (req, res) =>
  ok(res, await statsService.players({
    competitionId: req.query.competitionId as string | undefined,
    editionId: req.query.editionId as string | undefined,
  })),
));
publicRouter.get('/ads', asyncHandler(async (req, res) =>
  ok(res, await adsService.list(req.query.placement as string | undefined)),
));
publicRouter.get('/competitions/:competitionId/groups', asyncHandler(async (req, res) =>
  ok(res, await groupsService.list(req.params.competitionId)),
));
publicRouter.get('/competitions/:competitionId/bracket', asyncHandler(async (req, res) =>
  ok(res, await knockoutService.bracket(req.params.competitionId)),
));
publicRouter.get('/league-systems', asyncHandler(async (req, res) =>
  ok(res, await leagueSystemsService.list(req.query.editionId as string | undefined)),
));
publicRouter.get('/matches/:id', asyncHandler(async (req, res) =>
  ok(res, await matchesService.get(req.params.id)),
));
