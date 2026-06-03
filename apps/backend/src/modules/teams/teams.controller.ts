import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { teamsService } from './teams.service';

export const teamsController = {
  list: asyncHandler(async (_req, res) => ok(res, await teamsService.list())),
  get: asyncHandler(async (req, res) => ok(res, await teamsService.get(req.params.id))),
  create: asyncHandler(async (req, res) => created(res, await teamsService.create(req.body))),
  update: asyncHandler(async (req, res) => {
    const teamId = req.params.id;
    const user = req.user!;
    if (user.role === 'TEAM_LEADER') {
      if (user.teamId !== teamId) throw new AppError(403, MESSAGES.forbidden, 'FORBIDDEN');
      const allowed = ['logoUrl'];
      const keys = Object.keys(req.body);
      if (keys.length === 0 || keys.some((k) => !allowed.includes(k))) {
        throw new AppError(403, 'Solo puedes cambiar el logo del equipo', 'FORBIDDEN');
      }
    }
    ok(res, await teamsService.update(teamId, req.body));
  }),
  setStatus: asyncHandler(async (req, res) =>
    ok(res, await teamsService.setStatus(req.params.id, req.body.status)),
  ),
  register: asyncHandler(async (req, res) =>
    created(res, await teamsService.register(req.params.id, req.body.competitionId)),
  ),
  registrations: asyncHandler(async (req, res) =>
    ok(res, await teamsService.registrations(req.params.id)),
  ),
  history: asyncHandler(async (req, res) =>
    ok(res, await teamsService.history(req.params.id)),
  ),
  stats: asyncHandler(async (req, res) =>
    ok(res, await teamsService.stats(req.params.id)),
  ),
  players: asyncHandler(async (req, res) =>
    ok(res, await teamsService.players(req.params.id)),
  ),
};
