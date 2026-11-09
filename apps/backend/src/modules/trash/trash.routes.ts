import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { trashController } from './trash.controller';

export const trashRouter = Router();

/* La papelera guarda datos de todo el sistema (incluidas cuentas): solo el administrador general. */
trashRouter.use(authMiddleware, requireRole('ADMIN'));
trashRouter.get('/', trashController.list);
trashRouter.get('/:id', trashController.get);
trashRouter.post('/:id/restore', audit('RESTORE', 'Trash'), trashController.restore);
trashRouter.delete('/:id', audit('PURGE', 'Trash'), trashController.purge);
trashRouter.delete('/', audit('EMPTY', 'Trash'), trashController.empty);
