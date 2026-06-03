import type { RequestHandler } from 'express';
import { prisma } from '@/lib/prisma';

export const audit =
  (action: string, entity: string): RequestHandler =>
  (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode < 400) {
        prisma.auditLog
          .create({
            data: {
              action,
              entity,
              userId: req.user?.id ?? null,
              ip: req.ip ?? null,
              metadata: { params: req.params, body: req.body },
            },
          })
          .catch(() => undefined);
      }
    });
    next();
  };
