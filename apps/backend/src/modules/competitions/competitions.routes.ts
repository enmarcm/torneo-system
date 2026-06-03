import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { competitionsController } from './competitions.controller';
import {
  createCompetitionSchema,
  updateCompetitionSchema,
  competitionStatusSchema,
} from './competitions.schema';

export const competitionsRouter = Router();

competitionsRouter.get('/', competitionsController.list);
competitionsRouter.get('/:id', competitionsController.get);
competitionsRouter.post(
  '/',
  authMiddleware,
  requireRole('ADMIN'),
  validate(createCompetitionSchema),
  audit('CREATE', 'Competition'),
  competitionsController.create,
);
competitionsRouter.patch(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  validate(updateCompetitionSchema),
  audit('UPDATE', 'Competition'),
  competitionsController.update,
);
competitionsRouter.patch(
  '/:id/status',
  authMiddleware,
  requireRole('ADMIN'),
  validate(competitionStatusSchema),
  audit('STATUS', 'Competition'),
  competitionsController.setStatus,
);
