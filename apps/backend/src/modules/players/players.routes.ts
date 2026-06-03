import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { playersController } from './players.controller';
import {
  createPlayerSchema,
  updatePlayerSchema,
  playerStatusSchema,
  degreeSchema,
} from './players.schema';

export const playersRouter = Router();

playersRouter.use(authMiddleware, requireRole('ADMIN', 'TEAM_LEADER'));
playersRouter.get('/', playersController.list);
playersRouter.get('/by-document', playersController.byDocument);
playersRouter.get('/:id', playersController.get);
playersRouter.get('/:id/competitions', playersController.competitions);
playersRouter.post('/', validate(createPlayerSchema), audit('CREATE', 'Player'), playersController.create);
playersRouter.patch('/:id', validate(updatePlayerSchema), audit('UPDATE', 'Player'), playersController.update);
playersRouter.patch(
  '/:id/status',
  requireRole('ADMIN'),
  validate(playerStatusSchema),
  playersController.setStatus,
);
playersRouter.patch(
  '/:id/degree',
  requireRole('ADMIN'),
  validate(degreeSchema),
  playersController.setDegree,
);
