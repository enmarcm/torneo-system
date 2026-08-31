import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole, restrictFields } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { matchesController } from './matches.controller';
import { createMatchSchema, updateMatchSchema, setMvpSchema } from './matches.schema';
import { SCORING_ROLES } from '@/config/roles';

export const matchesRouter = Router();

/**
 * El anotador toca el resultado y nada más: crear, borrar o reprogramar un
 * partido sigue siendo del administrador. Por eso el PATCH general le acota los
 * campos a marcador y estado.
 */
const SCORE_FIELDS = ['homeScore', 'awayScore', 'status'] as const;

matchesRouter.get('/', matchesController.list);
matchesRouter.get('/:id', matchesController.get);
matchesRouter.use(authMiddleware);
matchesRouter.post(
  '/',
  requireRole('ADMIN'),
  validate(createMatchSchema),
  audit('CREATE', 'Match'),
  matchesController.create,
);
matchesRouter.patch(
  '/:id',
  requireRole(...SCORING_ROLES),
  restrictFields(['SCOREKEEPER'], SCORE_FIELDS),
  validate(updateMatchSchema),
  matchesController.update,
);
matchesRouter.patch(
  '/:id/start',
  requireRole(...SCORING_ROLES),
  audit('START', 'Match'),
  matchesController.start,
);
matchesRouter.patch(
  '/:id/finish',
  requireRole(...SCORING_ROLES),
  audit('FINISH', 'Match'),
  matchesController.finish,
);
matchesRouter.patch(
  '/:id/mvp',
  requireRole(...SCORING_ROLES),
  validate(setMvpSchema),
  audit('MVP', 'Match'),
  matchesController.setMvp,
);
matchesRouter.delete(
  '/:id/mvp',
  requireRole(...SCORING_ROLES),
  audit('MVP', 'Match'),
  matchesController.clearMvp,
);
matchesRouter.delete('/:id', requireRole('ADMIN'), matchesController.remove);
