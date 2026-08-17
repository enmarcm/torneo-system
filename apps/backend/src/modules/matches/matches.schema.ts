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
  // Nullable: el sorteo genera los cruces sin fecha y el admin la asigna después.
  scheduledAt: z.coerce.date().nullable().optional(),
  venue: z.string().optional(),
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED']).optional(),
});
export const updateMatchSchema = createMatchSchema.partial();

/** MVP del partido: la foto la sube el admin y queda descargable en el portal. */
export const setMvpSchema = z.object({
  playerId: z.string().uuid(),
  photoUrl: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export type CreateMatchDto = z.infer<typeof createMatchSchema>;
