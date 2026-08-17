import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { auditController } from './audit.controller';

export const auditRouter = Router();

// Solo lectura y solo para el admin: el registro no se edita ni se borra.
auditRouter.use(authMiddleware, requireRole('ADMIN'));
auditRouter.get('/', auditController.list);
auditRouter.get('/facets', auditController.facets);
