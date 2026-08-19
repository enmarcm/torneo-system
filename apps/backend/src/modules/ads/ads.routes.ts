import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { adsController } from './ads.controller';
import { createAdSchema, updateAdSchema } from './ads.schema';

export const adsRouter = Router();

// Lo público va antes del candado: el sitio lee los anuncios sin sesión.
adsRouter.get('/', adsController.list);

adsRouter.use(authMiddleware, requireRole('ADMIN'));
adsRouter.get('/manage', adsController.listAll);
adsRouter.post('/', validate(createAdSchema), adsController.create);
adsRouter.patch('/:id', validate(updateAdSchema), adsController.update);
adsRouter.delete('/:id', adsController.remove);
