import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { env } from '@/config/env';
import { uploadsController } from './uploads.controller';
import { requireRole } from '@/middlewares/role.middleware';
import rateLimit from 'express-rate-limit';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.UPLOAD_MAX_MB * 1024 * 1024 },
});

export const uploadsRouter = Router();

uploadsRouter.use(authMiddleware);
const uploadLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
uploadsRouter.post('/image', uploadLimit, upload.single('file'), uploadsController.image);
uploadsRouter.post('/document', requireRole('ADMIN'), uploadLimit, upload.single('file'), uploadsController.document);
uploadsRouter.get('/document/:key/url', requireRole('ADMIN'), uploadsController.documentUrl);
