import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { env } from '@/config/env';
import { uploadsController } from './uploads.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.UPLOAD_MAX_MB * 1024 * 1024 },
});

export const uploadsRouter = Router();

uploadsRouter.use(authMiddleware);
uploadsRouter.post('/image', upload.single('file'), uploadsController.image);
uploadsRouter.post('/document', upload.single('file'), uploadsController.document);
uploadsRouter.get('/document/:key/url', uploadsController.documentUrl);
