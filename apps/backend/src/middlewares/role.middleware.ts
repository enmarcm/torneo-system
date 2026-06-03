import type { RequestHandler } from 'express';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';

type Role = 'ADMIN' | 'TEAM_LEADER';

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, MESSAGES.forbidden, 'FORBIDDEN'));
    }
    next();
  };
