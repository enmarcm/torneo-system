import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { transfersController } from './transfers.controller';
import { createTransferSchema, transferStatusSchema } from './transfers.schema';

export const transfersRouter = Router();

transfersRouter.use(authMiddleware, requireRole('ADMIN', 'TEAM_LEADER'));
transfersRouter.get('/', transfersController.list);
transfersRouter.post('/', validate(createTransferSchema), audit('CREATE', 'Transfer'), transfersController.create);
transfersRouter.patch(
  '/:id/status',
  requireRole('ADMIN'),
  validate(transferStatusSchema),
  audit('STATUS', 'Transfer'),
  transfersController.setStatus,
);
