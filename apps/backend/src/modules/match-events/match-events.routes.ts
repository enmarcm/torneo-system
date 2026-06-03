import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { matchEventsController } from './match-events.controller';
import { createEventSchema } from './match-events.schema';

export const matchEventsRouter = Router();

matchEventsRouter.use(authMiddleware, requireRole('ADMIN'));
matchEventsRouter.post(
  '/matches/:id/events',
  validate(createEventSchema),
  audit('EVENT', 'MatchEvent'),
  matchEventsController.create,
);
matchEventsRouter.delete('/events/:id', matchEventsController.remove);
