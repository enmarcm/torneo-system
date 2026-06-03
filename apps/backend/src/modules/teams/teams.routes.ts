import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { teamsController } from './teams.controller';
import {
  createTeamSchema,
  updateTeamSchema,
  teamStatusSchema,
  registerTeamSchema,
} from './teams.schema';

export const teamsRouter = Router();

teamsRouter.get('/', teamsController.list);
teamsRouter.get('/:id', teamsController.get);
teamsRouter.get('/:id/history', teamsController.history);
teamsRouter.get('/:id/stats', teamsController.stats);
teamsRouter.get('/:id/players', teamsController.players);
teamsRouter.get('/:id/registrations', teamsController.registrations);
teamsRouter.post(
  '/',
  authMiddleware,
  requireRole('ADMIN'),
  validate(createTeamSchema),
  audit('CREATE', 'Team'),
  teamsController.create,
);
teamsRouter.patch(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'TEAM_LEADER'),
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
