import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { teamBlocksController } from './team-blocks.controller';
import { createTeamBlockSchema, liftTeamBlockSchema } from './team-blocks.schema';

export const teamBlocksRouter = Router();

teamBlocksRouter.use(authMiddleware, requireRole('ADMIN'));
teamBlocksRouter.get('/', teamBlocksController.list);
teamBlocksRouter.get('/team/:teamId', teamBlocksController.forTeam);
teamBlocksRouter.post(
  '/',
  validate(createTeamBlockSchema),
  audit('BLOCK', 'Team'),
  teamBlocksController.create,
);
teamBlocksRouter.patch(
  '/:id/lift',
  validate(liftTeamBlockSchema),
  audit('UNBLOCK', 'Team'),
  teamBlocksController.lift,
);
