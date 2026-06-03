import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';

export type AuthUser = {
  id: string;
  role: 'ADMIN' | 'TEAM_LEADER';
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
    const decoded = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET) as AuthUser;
    req.user = { id: decoded.id, role: decoded.role, teamId: decoded.teamId ?? null };
    next();
  } catch {
    next(new AppError(401, 'Token inválido o expirado', 'BAD_TOKEN'));
  }
};
