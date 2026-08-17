import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { matchEventsController } from './match-events.controller';
import { createEventSchema } from './match-events.schema';

export const matchEventsRouter = Router();

// Montado en '/': autenticación por ruta para no interceptar todo lo demás.
const adminOnly = [authMiddleware, requireRole('ADMIN')] as const;

matchEventsRouter.post(
  '/matches/:id/events',
  ...adminOnly,
  validate(createEventSchema),
  audit('EVENT', 'MatchEvent'),
  matchEventsController.create,
);
matchEventsRouter.delete('/events/:id', ...adminOnly, matchEventsController.remove);
