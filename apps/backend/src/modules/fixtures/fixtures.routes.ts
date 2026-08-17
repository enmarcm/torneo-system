import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { fixturesController } from './fixtures.controller';
import { clearFixtureSchema, scheduleBulkSchema, scheduleMatchSchema } from './fixtures.schema';

export const fixturesRouter = Router();

// Este router se monta en '/', así que la autenticación va ruta por ruta:
// un `use(authMiddleware)` global respondería 401 a cualquier path no encontrado.
const adminOnly = [authMiddleware, requireRole('ADMIN')] as const;

fixturesRouter.post(
  '/competitions/:competitionId/fixture/league',
  ...adminOnly,
  audit('DRAW', 'Fixture'),
  fixturesController.generateLeague,
);
fixturesRouter.post(
  '/competitions/:competitionId/fixture/groups',
  ...adminOnly,
  audit('DRAW', 'Fixture'),
  fixturesController.generateGroupStage,
);
fixturesRouter.delete(
  '/competitions/:competitionId/fixture',
  ...adminOnly,
  validate(clearFixtureSchema),
  audit('CLEAR', 'Fixture'),
  fixturesController.clear,
);
fixturesRouter.patch(
  '/matches/:matchId/schedule',
  ...adminOnly,
  validate(scheduleMatchSchema),
  audit('SCHEDULE', 'Match'),
  fixturesController.schedule,
);
fixturesRouter.patch(
  '/fixture/schedule-bulk',
  ...adminOnly,
  validate(scheduleBulkSchema),
  audit('SCHEDULE', 'Match'),
  fixturesController.scheduleBulk,
);
