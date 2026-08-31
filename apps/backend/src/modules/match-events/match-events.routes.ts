import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { matchEventsController } from './match-events.controller';
import { createEventSchema } from './match-events.schema';
import { SCORING_ROLES } from '@/config/roles';

export const matchEventsRouter = Router();

// Montado en '/': autenticación por ruta para no interceptar todo lo demás.
const scoring = [authMiddleware, requireRole(...SCORING_ROLES)] as const;

matchEventsRouter.post(
  '/matches/:id/events',
  ...scoring,
  validate(createEventSchema),
  audit('EVENT', 'MatchEvent'),
  matchEventsController.create,
);
matchEventsRouter.delete('/events/:id', ...scoring, matchEventsController.remove);
