import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { rostersController } from './rosters.controller';
import { addRosterSchema, updateRosterSchema, eligibilitySchema } from './rosters.schema';

export const rostersRouter = Router();

// Montado en '/': autenticación por ruta para no interceptar todo lo demás.
const staff = [authMiddleware, requireRole('ADMIN', 'TEAM_LEADER')] as const;
const adminOnly = [authMiddleware, requireRole('ADMIN')] as const;

rostersRouter.get('/registrations/:registrationId/roster', ...staff, rostersController.list);
rostersRouter.post(
  '/registrations/:registrationId/roster',
  ...staff,
  validate(addRosterSchema),
  audit('ADD', 'RosterEntry'),
  rostersController.add,
);
rostersRouter.patch('/roster/:id', ...staff, validate(updateRosterSchema), rostersController.update);
rostersRouter.patch(
  '/roster/:id/eligibility',
  ...adminOnly,
  validate(eligibilitySchema),
  audit('ELIGIBILITY', 'RosterEntry'),
  rostersController.setEligibility,
);
rostersRouter.delete(
  '/roster/:id',
  ...staff,
  audit('REMOVE', 'RosterEntry'),
  rostersController.remove,
);
