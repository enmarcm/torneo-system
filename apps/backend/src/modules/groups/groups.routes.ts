import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { groupsController } from './groups.controller';
import { generateGroupsSchema, assignTeamsSchema } from './groups.schema';

export const groupsRouter = Router();

// Este router se monta en '/'. La autenticación va ruta por ruta: con un
// `use(authMiddleware)` global, cualquier path inexistente de la API devolvería
// 401 en vez de 404 y bloquearía las rutas públicas montadas después.
const adminOnly = [authMiddleware, requireRole('ADMIN')] as const;

groupsRouter.post(
  '/competitions/:competitionId/groups',
  ...adminOnly,
  validate(generateGroupsSchema),
  audit('GENERATE', 'CompetitionGroup'),
  groupsController.generate,
);
// Los grupos son públicos: se muestran en el portal junto al cuadro.
groupsRouter.get('/competitions/:competitionId/groups', groupsController.list);
groupsRouter.patch(
  '/groups/:id/teams',
  ...adminOnly,
  validate(assignTeamsSchema),
  audit('ASSIGN', 'CompetitionGroup'),
  groupsController.assignTeams,
);
