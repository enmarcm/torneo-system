import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole, restrictFields } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { teamsController } from './teams.controller';
import {
  createTeamSchema,
  updateTeamSchema,
  teamStatusSchema,
  registerTeamSchema,
} from './teams.schema';
import { MEDIA_FIELDS } from '@/config/roles';
import { ownTeam } from '@/middlewares/team-ownership.middleware';

export const teamsRouter = Router();

teamsRouter.get('/', authMiddleware, requireRole('ADMIN'), teamsController.list);
teamsRouter.get('/:id', authMiddleware, requireRole('ADMIN', 'TEAM_LEADER'), ownTeam, teamsController.get);
teamsRouter.get('/:id/history', authMiddleware, requireRole('ADMIN', 'TEAM_LEADER'), ownTeam, teamsController.history);
teamsRouter.get('/:id/stats', authMiddleware, requireRole('ADMIN', 'TEAM_LEADER'), ownTeam, teamsController.stats);
teamsRouter.get('/:id/players', authMiddleware, requireRole('ADMIN', 'TEAM_LEADER'), ownTeam, teamsController.players);
teamsRouter.get('/:id/registrations', authMiddleware, requireRole('ADMIN', 'TEAM_LEADER'), ownTeam, teamsController.registrations);
teamsRouter.post(
  '/',
  authMiddleware,
  requireRole('ADMIN'),
  validate(createTeamSchema),
  audit('CREATE', 'Team'),
  teamsController.create,
);
/* El community manager entra a este PATCH, pero solo con `logoUrl`. */
teamsRouter.patch(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'TEAM_LEADER', 'COMMUNITY_MANAGER'),
  ownTeam,
  restrictFields(['COMMUNITY_MANAGER'], MEDIA_FIELDS.team),
  validate(updateTeamSchema),
  audit('UPDATE', 'Team'),
  teamsController.update,
);
teamsRouter.patch(
  '/:id/status',
  authMiddleware,
  requireRole('ADMIN'),
  validate(teamStatusSchema),
  audit('STATUS', 'Team'),
  teamsController.setStatus,
);
teamsRouter.post(
  '/:id/registrations',
  authMiddleware,
  requireRole('ADMIN'),
  validate(registerTeamSchema),
  audit('REGISTER', 'TeamRegistration'),
  teamsController.register,
);
teamsRouter.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  audit('DELETE', 'Team'),
  teamsController.remove,
);
