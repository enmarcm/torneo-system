import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/utils/app-error';
import { logger } from '@/lib/logger';

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json({ success: false, code: err.code, message: err.message });
  }
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      code: 'VALIDATION',
      message: 'Datos inválidos',
      fields: err.flatten().fieldErrors,
    });
  }
  logger.error(err?.message ?? 'error', { stack: err?.stack });
  return res
    .status(500)
    .json({ success: false, code: 'INTERNAL', message: 'Error interno del servidor' });
};
