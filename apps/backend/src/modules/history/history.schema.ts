import { z } from 'zod';

export const historyFiltersSchema = z.object({
  q: z.string().trim().max(100).optional(),
  year: z.coerce.number().int().min(1900).max(2200).optional(),
  editionId: z.string().uuid().optional(),
  competitionId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  ageGroup: z.enum(['ADULT', 'YOUTH']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.enum(['name', 'goals', 'matches', 'tournaments']).default('goals'),
});
export const historyIdSchema = z.object({ id: z.string().uuid() });
export type HistoryFilters = z.infer<typeof historyFiltersSchema>;
