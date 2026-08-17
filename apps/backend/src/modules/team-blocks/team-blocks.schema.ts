import { z } from 'zod';

export const createTeamBlockSchema = z
  .object({
    teamId: z.string().uuid(),
    scope: z.enum(['CLUB', 'COMPETITION']).default('CLUB'),
    competitionId: z.string().uuid().optional(),
    reason: z.string().min(3, 'Indicá el motivo del bloqueo'),
  })
  .refine((d) => d.scope !== 'COMPETITION' || !!d.competitionId, {
    message: 'Un bloqueo por competición necesita competitionId',
    path: ['competitionId'],
  });

export const liftTeamBlockSchema = z.object({
  liftReason: z.string().optional(),
});

export type CreateTeamBlockDto = z.infer<typeof createTeamBlockSchema>;
