import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { matchesController } from './matches.controller';
import { createMatchSchema, updateMatchSchema } from './matches.schema';

export const matchesRouter = Router();

matchesRouter.get('/', matchesController.list);
matchesRouter.get('/:id', matchesController.get);
matchesRouter.use(authMiddleware, requireRole('ADMIN'));
matchesRouter.post('/', validate(createMatchSchema), audit('CREATE', 'Match'), matchesController.create);
matchesRouter.patch('/:id', validate(updateMatchSchema), matchesController.update);
matchesRouter.patch('/:id/start', audit('START', 'Match'), matchesController.start);
matchesRouter.patch('/:id/finish', audit('FINISH', 'Match'), matchesController.finish);
matchesRouter.delete('/:id', matchesController.remove);
