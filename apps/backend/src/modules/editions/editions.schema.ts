import { z } from 'zod';

export const createEditionSchema = z.object({
  name: z.string().min(2),
  year: z.number().int(),
  seasonNumber: z.number().int().min(1).max(3),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});
export const updateEditionSchema = createEditionSchema.partial();
export const editionStatusSchema = z.object({ status: z.enum(['DRAFT', 'ACTIVE', 'FINISHED']) });
export const transfersSchema = z.object({
  transfersOpen: z.boolean(),
  transferWindowStart: z.coerce.date().optional(),
  transferWindowEnd: z.coerce.date().optional(),
});

export type CreateEditionDto = z.infer<typeof createEditionSchema>;
export type UpdateEditionDto = z.infer<typeof updateEditionSchema>;
