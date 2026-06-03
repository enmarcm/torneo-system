import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { rostersController } from './rosters.controller';
import { addRosterSchema, updateRosterSchema, eligibilitySchema } from './rosters.schema';

export const rostersRouter = Router();

rostersRouter.use(authMiddleware, requireRole('ADMIN', 'TEAM_LEADER'));
rostersRouter.get('/registrations/:registrationId/roster', rostersController.list);
rostersRouter.post(
  '/registrations/:registrationId/roster',
  validate(addRosterSchema),
  audit('ADD', 'RosterEntry'),
  rostersController.add,
);
rostersRouter.patch('/roster/:id', validate(updateRosterSchema), rostersController.update);
rostersRouter.patch(
  '/roster/:id/eligibility',
  requireRole('ADMIN'),
  validate(eligibilitySchema),
  audit('ELIGIBILITY', 'RosterEntry'),
  rostersController.setEligibility,
);
rostersRouter.delete('/roster/:id', audit('REMOVE', 'RosterEntry'), rostersController.remove);
