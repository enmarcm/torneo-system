import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole, restrictFields } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { categoriesController } from './categories.controller';
import { createCategorySchema, updateCategorySchema } from './categories.schema';
import { MEDIA_FIELDS, MEDIA_ROLES } from '@/config/roles';

export const categoriesRouter = Router();

categoriesRouter.get('/', categoriesController.list);
categoriesRouter.use(authMiddleware);
categoriesRouter.post(
  '/',
  requireRole('ADMIN'),
  validate(createCategorySchema),
  audit('CREATE', 'Category'),
  categoriesController.create,
);
/* El community manager entra a este PATCH, pero solo con `imageUrl`. */
categoriesRouter.patch(
  '/:id',
  requireRole(...MEDIA_ROLES),
  restrictFields(['COMMUNITY_MANAGER'], MEDIA_FIELDS.category),
  validate(updateCategorySchema),
  audit('UPDATE', 'Category'),
  categoriesController.update,
);
categoriesRouter.delete('/:id', requireRole('ADMIN'), audit('DELETE', 'Category'), categoriesController.remove);
