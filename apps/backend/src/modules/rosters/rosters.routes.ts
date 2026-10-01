import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { rostersController } from './rosters.controller';
import { ownRegistration, ownRosterEntry } from '@/middlewares/team-ownership.middleware';
import { addRosterSchema, updateRosterSchema, eligibilitySchema } from './rosters.schema';

export const rostersRouter = Router();

// Montado en '/': autenticación por ruta para no interceptar todo lo demás.
const staff = [authMiddleware, requireRole('ADMIN', 'TEAM_LEADER')] as const;
/* El anotador solo lee la plantilla: la necesita para elegir el autor del gol. */
const readRoster = [authMiddleware, requireRole('ADMIN', 'TEAM_LEADER', 'SCOREKEEPER')] as const;
const adminOnly = [authMiddleware, requireRole('ADMIN')] as const;

rostersRouter.get('/registrations/:registrationId/roster', ...readRoster, ownRegistration, rostersController.list);
rostersRouter.post(
  '/registrations/:registrationId/roster',
  ...staff,
  ownRegistration,
  validate(addRosterSchema),
  audit('ADD', 'RosterEntry'),
  rostersController.add,
);
/* Traer la plantilla del torneo anterior: primero se mira qué entraría, después se importa. */
rostersRouter.get(
  '/registrations/:registrationId/roster/previous',
  ...staff,
  ownRegistration,
  rostersController.previous,
);
rostersRouter.post(
  '/registrations/:registrationId/roster/import-previous',
  ...staff,
  ownRegistration,
  audit('IMPORT', 'RosterEntry'),
  rostersController.importPrevious,
);
rostersRouter.patch('/roster/:id', ...staff, ownRosterEntry, validate(updateRosterSchema), rostersController.update);
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
  ownRosterEntry,
  audit('REMOVE', 'RosterEntry'),
  rostersController.remove,
);
