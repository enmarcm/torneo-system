import { Router } from 'express';
import { validate } from '@/middlewares/validate.middleware';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { authController } from './auth.controller';
import { changePasswordSchema, loginSchema, updateMeSchema } from './auth.schema';

export const authRouter = Router();

authRouter.post('/login', validate(loginSchema), authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authMiddleware, authController.me);
authRouter.patch('/me', authMiddleware, validate(updateMeSchema), authController.updateMe);
authRouter.patch(
  '/me/password',
  authMiddleware,
  validate(changePasswordSchema),
  authController.changePassword,
);
