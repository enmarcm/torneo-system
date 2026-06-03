import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  defaultFormat: z.enum(['LEAGUE', 'GROUPS_KNOCKOUT']).default('LEAGUE'),
  defaultAgeMin: z.number().int().optional(),
  defaultAgeMax: z.number().int().optional(),
  defaultRequiresAdminEligibility: z.boolean().default(false),
  defaultMinPlayers: z.number().int().min(1).default(11),
  defaultMaxPlayers: z.number().int().min(1).default(25),
});
export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
