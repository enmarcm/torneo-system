import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { usersController } from './users.controller';
import { createUserSchema, updateUserStatusSchema } from './users.schema';

export const usersRouter = Router();

usersRouter.use(authMiddleware, requireRole('ADMIN'));
usersRouter.get('/', usersController.list);
usersRouter.post('/', validate(createUserSchema), audit('CREATE', 'User'), usersController.create);
usersRouter.patch(
  '/:id/status',
  validate(updateUserStatusSchema),
  audit('STATUS', 'User'),
  usersController.setStatus,
);
usersRouter.delete('/:id', audit('DELETE', 'User'), usersController.remove);
