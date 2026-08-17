import { z } from 'zod';

export const setTieTeamsSchema = z.object({
  homeRegistrationId: z.string().uuid(),
  awayRegistrationId: z.string().uuid(),
});

export const setTieWinnerSchema = z.object({
  winnerRegistrationId: z.string().uuid(),
});
