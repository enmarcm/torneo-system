import { z } from 'zod';

export const clearFixtureSchema = z.object({
  stage: z.enum(['LEAGUE', 'GROUP']),
});

export const scheduleMatchSchema = z.object({
  scheduledAt: z.string().datetime().nullable(),
  venue: z.string().nullable().optional(),
  featured: z.boolean().optional(),
});

export const scheduleBulkSchema = z.object({
  items: z
    .array(
      z.object({
        matchId: z.string().uuid(),
        scheduledAt: z.string().datetime(),
        venue: z.string().optional(),
      }),
    )
    .min(1),
});
