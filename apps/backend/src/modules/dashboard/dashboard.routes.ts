import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { dashboardController } from './dashboard.controller';

export const dashboardRouter = Router();
dashboardRouter.use(authMiddleware, requireRole('ADMIN'));
dashboardRouter.get('/', dashboardController.metrics);
