import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { audit } from '@/middlewares/audit.middleware';
import { newsController } from './news.controller';
import { createArticleSchema, updateArticleSchema } from './news.schema';
import { MEDIA_ROLES } from '@/config/roles';

export const newsRouter = Router();

/*
  Las noticias son contenido del sitio, igual que la publicidad: las escribe el
  community manager y el administrador. Lo público sale por /public/news.
*/
newsRouter.use(authMiddleware, requireRole(...MEDIA_ROLES));

// Antes de "/:id", si no la ruta se come estas dos como si fueran un id.
newsRouter.get('/manage', newsController.listAll);
newsRouter.get('/preview', newsController.preview);

newsRouter.get('/:id', newsController.get);
newsRouter.post('/', validate(createArticleSchema), audit('CREATE', 'Article'), newsController.create);
newsRouter.patch('/:id', validate(updateArticleSchema), audit('UPDATE', 'Article'), newsController.update);
newsRouter.post('/:id/snapshot', audit('SNAPSHOT', 'Article'), newsController.regenerate);
newsRouter.delete('/:id', audit('DELETE', 'Article'), newsController.remove);
