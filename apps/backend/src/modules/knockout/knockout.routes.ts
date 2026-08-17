import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { knockoutController } from './knockout.controller';
import { setTieTeamsSchema, setTieWinnerSchema } from './knockout.schema';

export const knockoutRouter = Router();

// Montado en '/': autenticación por ruta, no con un `use` global.
const adminOnly = [authMiddleware, requireRole('ADMIN')] as const;

knockoutRouter.get('/competitions/:competitionId/bracket', knockoutController.bracket);
knockoutRouter.post(
  '/competitions/:competitionId/bracket',
  ...adminOnly,
  audit('GENERATE', 'KnockoutTie'),
  knockoutController.generate,
);
knockoutRouter.post(
  '/competitions/:competitionId/bracket/seed',
  ...adminOnly,
  audit('SEED', 'KnockoutTie'),
  knockoutController.seedFromGroups,
);
knockoutRouter.patch(
  '/ties/:id/teams',
  ...adminOnly,
  validate(setTieTeamsSchema),
  audit('UPDATE', 'KnockoutTie'),
  knockoutController.setTeams,
);
knockoutRouter.post(
  '/ties/:id/matches',
  ...adminOnly,
  audit('CREATE', 'KnockoutTie'),
  knockoutController.createMatches,
);
knockoutRouter.post(
  '/ties/:id/resolve',
  ...adminOnly,
  audit('RESOLVE', 'KnockoutTie'),
  knockoutController.resolve,
);
knockoutRouter.patch(
  '/ties/:id/winner',
  ...adminOnly,
  validate(setTieWinnerSchema),
  audit('WINNER', 'KnockoutTie'),
  knockoutController.setWinner,
);
