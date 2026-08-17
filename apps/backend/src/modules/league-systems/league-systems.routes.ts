import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { leagueSystemsController } from './league-systems.controller';
import {
  createLeagueSystemSchema,
  updateLeagueSystemSchema,
  attachDivisionSchema,
  attachCupSchema,
} from './league-systems.schema';

export const leagueSystemsRouter = Router();

leagueSystemsRouter.get('/', leagueSystemsController.list);
leagueSystemsRouter.get('/:id', leagueSystemsController.get);

leagueSystemsRouter.use(authMiddleware, requireRole('ADMIN'));
leagueSystemsRouter.get('/:id/eligible-teams', leagueSystemsController.eligibleForCup);
leagueSystemsRouter.post(
  '/',
  validate(createLeagueSystemSchema),
  audit('CREATE', 'LeagueSystem'),
  leagueSystemsController.create,
);
leagueSystemsRouter.patch(
  '/:id',
  validate(updateLeagueSystemSchema),
  audit('UPDATE', 'LeagueSystem'),
  leagueSystemsController.update,
);
leagueSystemsRouter.post(
  '/:id/divisions',
  validate(attachDivisionSchema),
  audit('ATTACH', 'LeagueSystem'),
  leagueSystemsController.attachDivision,
);
leagueSystemsRouter.post(
  '/:id/cups',
  validate(attachCupSchema),
  audit('ATTACH', 'LeagueSystem'),
  leagueSystemsController.attachCup,
);
leagueSystemsRouter.delete(
  '/competitions/:competitionId',
  audit('DETACH', 'LeagueSystem'),
  leagueSystemsController.detach,
);
