import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { siteController } from './site.controller';
import { updateSettingsSchema, createLegalPageSchema, updateLegalPageSchema } from './site.schema';

/** Lo que lee cualquier visitante: se monta bajo /public. */
export const sitePublicRouter = Router();
sitePublicRouter.get('/site', siteController.publicSite);
sitePublicRouter.get('/legal/:slug', siteController.publicLegalPage);

/*
  Editar los datos de la empresa y los textos legales es responsabilidad de la
  liga, no del contenido diario: solo el administrador. Se monta bajo /settings.
*/
export const siteAdminRouter = Router();
siteAdminRouter.use(authMiddleware, requireRole('ADMIN'));

siteAdminRouter.get('/', siteController.getSettings);
siteAdminRouter.put('/', validate(updateSettingsSchema), audit('UPDATE', 'SiteSettings'), siteController.updateSettings);

siteAdminRouter.get('/legal', siteController.listLegalPages);
siteAdminRouter.post('/legal', validate(createLegalPageSchema), audit('CREATE', 'LegalPage'), siteController.createLegalPage);
siteAdminRouter.patch('/legal/:id', validate(updateLegalPageSchema), audit('UPDATE', 'LegalPage'), siteController.updateLegalPage);
siteAdminRouter.delete('/legal/:id', audit('DELETE', 'LegalPage'), siteController.removeLegalPage);
