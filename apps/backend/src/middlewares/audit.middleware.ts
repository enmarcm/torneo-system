import type { RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/*
  La auditoría guarda el cuerpo de la petición tal cual llegó. Alta de usuario y
  cambio de contraseña lo mandan en claro, así que esas claves se enmascaran
  antes de escribir el registro.
*/
const SECRET_KEYS = ['password', 'newPassword', 'currentPassword', 'leaderPassword', 'passwordHash'];

const redact = (body: unknown): Prisma.InputJsonValue => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return (body ?? {}) as Prisma.InputJsonValue;
  const out: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  for (const key of SECRET_KEYS) if (key in out) out[key] = '***';
  return out as Prisma.InputJsonValue;
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
              metadata: { params: req.params, body: redact(req.body) },
            },
          })
          .catch(() => undefined);
      }
    });
    next();
  };
