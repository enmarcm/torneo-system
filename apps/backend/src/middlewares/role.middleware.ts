import type { RequestHandler } from 'express';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import type { UserRole } from '@/config/roles';

export const requireRole =
  (...roles: readonly UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, MESSAGES.forbidden, 'FORBIDDEN'));
    }
    next();
  };

/**
 * Acota lo que ciertos roles pueden mandar en el cuerpo. Sirve para dejar que
 * el community manager cambie la imagen de una categoría o el escudo de un
 * equipo sin abrirle el resto de la ficha.
 *
 * Va antes de `validate`: se mira lo que llegó, no lo que el schema completó
 * con valores por defecto.
 */
export const restrictFields =
  (roles: readonly UserRole[], allowed: readonly string[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next();
    const body = (req.body ?? {}) as Record<string, unknown>;
    const extra = Object.keys(body).filter((k) => !allowed.includes(k));
    if (extra.length) {
      return next(
        new AppError(
          403,
          `Tu perfil solo puede modificar: ${allowed.join(', ')}`,
          'FIELD_FORBIDDEN',
        ),
      );
    }
    next();
  };
