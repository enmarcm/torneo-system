import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole, restrictFields } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { competitionsController } from './competitions.controller';
import {
  createCompetitionSchema,
  updateCompetitionSchema,
  competitionStatusSchema,
  registrationOutcomeSchema,
} from './competitions.schema';
import { MEDIA_FIELDS, MEDIA_ROLES } from '@/config/roles';

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
/* El community manager entra a este PATCH, pero solo con `imageUrl`. */
competitionsRouter.patch(
  '/:id',
  authMiddleware,
  requireRole(...MEDIA_ROLES),
  restrictFields(['COMMUNITY_MANAGER'], MEDIA_FIELDS.competition),
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
competitionsRouter.patch(
  '/registrations/:registrationId/outcome',
  authMiddleware,
  requireRole('ADMIN'),
  validate(registrationOutcomeSchema),
  audit('OUTCOME', 'TeamRegistration'),
  competitionsController.setRegistrationOutcome,
);
competitionsRouter.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  audit('DELETE', 'Competition'),
  competitionsController.remove,
);
