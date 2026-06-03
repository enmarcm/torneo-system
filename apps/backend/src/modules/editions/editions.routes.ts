import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { editionsController } from './editions.controller';
import {
  createEditionSchema,
  updateEditionSchema,
  editionStatusSchema,
  transfersSchema,
} from './editions.schema';

export const editionsRouter = Router();

editionsRouter.get('/', editionsController.list);
editionsRouter.get('/:id', editionsController.get);
editionsRouter.post(
  '/',
  authMiddleware,
  requireRole('ADMIN'),
  validate(createEditionSchema),
  audit('CREATE', 'Edition'),
  editionsController.create,
);
editionsRouter.patch(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  validate(updateEditionSchema),
  audit('UPDATE', 'Edition'),
  editionsController.update,
);
editionsRouter.patch(
  '/:id/status',
  authMiddleware,
  requireRole('ADMIN'),
  validate(editionStatusSchema),
  audit('STATUS', 'Edition'),
  editionsController.setStatus,
);
editionsRouter.patch(
  '/:id/transfers',
  authMiddleware,
  requireRole('ADMIN'),
  validate(transfersSchema),
  audit('TRANSFERS', 'Edition'),
  editionsController.setTransfers,
);
