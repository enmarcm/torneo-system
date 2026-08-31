import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { usersController } from './users.controller';
import {
  createUserSchema,
  listUsersSchema,
  updateUserPasswordSchema,
  updateUserSchema,
  updateUserStatusSchema,
} from './users.schema';

export const usersRouter = Router();

/* Administrar cuentas es exclusivo del administrador general. */
usersRouter.use(authMiddleware, requireRole('ADMIN'));
usersRouter.get('/', validate(listUsersSchema, 'query'), usersController.list);
usersRouter.get('/:id', usersController.get);
usersRouter.post('/', validate(createUserSchema), audit('CREATE', 'User'), usersController.create);
usersRouter.patch(
  '/:id',
  validate(updateUserSchema),
  audit('UPDATE', 'User'),
  usersController.update,
);
usersRouter.patch(
  '/:id/password',
  validate(updateUserPasswordSchema),
  // La auditoría enmascara `password`, así que queda el hecho y no la clave.
  audit('PASSWORD', 'User'),
  usersController.setPassword,
);
usersRouter.patch(
  '/:id/status',
  validate(updateUserStatusSchema),
  audit('STATUS', 'User'),
  usersController.setStatus,
);
usersRouter.delete('/:id', audit('DELETE', 'User'), usersController.remove);
