import type { RequestHandler } from 'express';
import { ZodSchema } from 'zod';

type Part = 'body' | 'params' | 'query';

export const validate =
  (schema: ZodSchema, part: Part = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) return next(result.error);
    (req as unknown as Record<string, unknown>)[part] = result.data;
    next();
  };
