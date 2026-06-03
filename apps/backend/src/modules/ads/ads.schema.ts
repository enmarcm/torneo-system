import { z } from 'zod';

export const createAdSchema = z.object({
  imageUrl: z.string().min(1),
  linkUrl: z.string().optional(),
  placement: z.enum(['HOME_BANNER', 'SIDEBAR', 'FOOTER']),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export const updateAdSchema = createAdSchema.partial();
