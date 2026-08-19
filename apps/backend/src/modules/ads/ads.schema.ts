import { z } from 'zod';

export const AD_PLACEMENTS = [
  'HOME_BANNER',
  'HOME_INLINE',
  'SIDEBAR',
  'FOOTER',
  'FOOTER_LOGOS',
  'MATCH_LIST',
  'MATCH_DETAIL',
  'STANDINGS',
  'LIVE',
  'STATS',
  'TEAMS',
] as const;

export const createAdSchema = z
  .object({
    title: z.string().trim().min(1, 'Ponele un nombre para reconocerlo en el panel').max(80),
    imageUrl: z.string().min(1),
    // `.nullish()` en los campos que admiten NULL: el formulario manda null para
    // limpiarlos, y `.optional()` a secas lo rechazaba con 422.
    linkUrl: z.string().nullish(),
    placements: z
      .array(z.enum(AD_PLACEMENTS))
      .min(1, 'Elegí al menos una ubicación donde mostrarlo'),
    sortOrder: z.number().int().default(0),
    active: z.boolean().default(true),
    startDate: z.coerce.date().nullish(),
    endDate: z.coerce.date().nullish(),
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    message: 'La fecha de fin no puede ser anterior a la de inicio',
    path: ['endDate'],
  });

export const updateAdSchema = createAdSchema.innerType().partial();
