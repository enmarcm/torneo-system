import type { RequestHandler } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'authorization', 'apiKey', 'api_key'];

const sanitize = (obj: Record<string, unknown>): Record<string, unknown> => {
  if (!obj || typeof obj !== 'object') return obj;
  const copy: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_FIELDS.some((f) => key.toLowerCase().includes(f))) {
      copy[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      copy[key] = sanitize(obj[key] as Record<string, unknown>);
    } else {
      copy[key] = obj[key];
    }
  }
  return copy;
};

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
              metadata: { params: sanitize(req.params as Record<string, unknown>), body: sanitize(req.body as Record<string, unknown>) } as Prisma.InputJsonValue,
            },
          })
          .catch(() => undefined);
      }
    });
    next();
  };
