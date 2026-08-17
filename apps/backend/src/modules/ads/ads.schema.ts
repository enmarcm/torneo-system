import { z } from 'zod';

export const createAdSchema = z.object({
  imageUrl: z.string().min(1),
  // `.nullish()` en los campos que admiten NULL: el formulario manda null para
  // limpiarlos, y `.optional()` a secas lo rechazaba con 422.
  linkUrl: z.string().nullish(),
  placement: z.enum(['HOME_BANNER', 'SIDEBAR', 'FOOTER']),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
  startDate: z.coerce.date().nullish(),
  endDate: z.coerce.date().nullish(),
});
export const updateAdSchema = createAdSchema.partial();
