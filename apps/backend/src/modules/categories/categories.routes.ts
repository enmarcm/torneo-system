import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { categoriesController } from './categories.controller';
import { createCategorySchema, updateCategorySchema } from './categories.schema';

export const categoriesRouter = Router();

categoriesRouter.get('/', categoriesController.list);
categoriesRouter.use(authMiddleware, requireRole('ADMIN'));
categoriesRouter.post(
  '/',
  validate(createCategorySchema),
  audit('CREATE', 'Category'),
  categoriesController.create,
);
categoriesRouter.patch(
  '/:id',
  validate(updateCategorySchema),
  audit('UPDATE', 'Category'),
  categoriesController.update,
);
categoriesRouter.delete('/:id', audit('DELETE', 'Category'), categoriesController.remove);
