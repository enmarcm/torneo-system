import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { groupsController } from './groups.controller';
import { generateGroupsSchema, assignTeamsSchema } from './groups.schema';

export const groupsRouter = Router();

groupsRouter.use(authMiddleware, requireRole('ADMIN'));
groupsRouter.post(
  '/competitions/:competitionId/groups',
  validate(generateGroupsSchema),
  audit('GENERATE', 'CompetitionGroup'),
  groupsController.generate,
);
groupsRouter.get('/competitions/:competitionId/groups', groupsController.list);
groupsRouter.patch(
  '/groups/:id/teams',
  validate(assignTeamsSchema),
  audit('ASSIGN', 'CompetitionGroup'),
  groupsController.assignTeams,
);
