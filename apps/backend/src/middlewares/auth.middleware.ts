import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import type { UserRole } from '@/config/roles';
import { prisma } from '@/lib/prisma';

export type AuthUser = {
  id: string;
  role: UserRole;
  teamId?: string | null;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authMiddleware: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, MESSAGES.unauthorized, 'NO_AUTH'));
  }
  try {
    const decoded = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as AuthUser & { iat?: number };
    if (!decoded.id) throw new Error('Token sin usuario');
    void prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, status: true, teamId: true, updatedAt: true },
    }).then((user) => {
      if (!user || user.status !== 'ACTIVE') {
        next(new AppError(401, 'Token inválido o revocado', 'BAD_TOKEN'));
        return;
      }
      const changedAt = Math.floor(user.updatedAt.getTime() / 1000);
      if (decoded.iat !== undefined && decoded.iat < changedAt) {
        next(new AppError(401, 'Token revocado', 'BAD_TOKEN'));
        return;
      }
      req.user = { id: user.id, role: user.role as UserRole, teamId: user.teamId };
      next();
    }, () => next(new AppError(503, 'No se pudo validar la sesión', 'AUTH_UNAVAILABLE')));
  } catch {
    next(new AppError(401, 'Token inválido o expirado', 'BAD_TOKEN'));
  }
};
