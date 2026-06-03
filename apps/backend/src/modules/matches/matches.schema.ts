import { z } from 'zod';

export const createMatchSchema = z.object({
  competitionId: z.string().uuid(),
  groupId: z.string().uuid().optional(),
  stage: z
    .enum(['LEAGUE', 'GROUP', 'R16', 'QUARTER', 'SEMI', 'THIRD', 'FINAL'])
    .default('LEAGUE'),
  matchday: z.number().int().min(1).default(1),
  homeRegistrationId: z.string().uuid(),
  awayRegistrationId: z.string().uuid(),
  scheduledAt: z.coerce.date(),
  venue: z.string().optional(),
});
export const updateMatchSchema = createMatchSchema.partial();

export type CreateMatchDto = z.infer<typeof createMatchSchema>;
