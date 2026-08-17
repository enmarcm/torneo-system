import { z } from 'zod';

// Los campos que en la base admiten NULL se declaran `.nullish()` (null o
// undefined). Con `.optional()` a secas, mandar null desde el formulario para
// limpiar el valor devolvía 422 en vez de borrarlo.
export const createCategorySchema = z.object({
  name: z.string().min(2),
  description: z.string().nullish(),
  imageUrl: z.string().nullish(),
  defaultFormat: z.enum(['LEAGUE', 'GROUPS_KNOCKOUT']).default('LEAGUE'),
  defaultKind: z.enum(['LEAGUE_DIVISION', 'CUP', 'YOUTH', 'SPECIAL']).default('SPECIAL'),
  defaultDivisionLevel: z.number().int().min(1).max(10).nullable().optional(),
  defaultAgeMin: z.number().int().nullish(),
  defaultAgeMax: z.number().int().nullish(),
  defaultRequiresAdminEligibility: z.boolean().default(false),
  defaultMinPlayers: z.number().int().min(1).default(11),
  defaultMaxPlayers: z.number().int().min(1).default(25),
});
export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
