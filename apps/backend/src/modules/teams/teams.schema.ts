import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(2),
  // `.nullish()`: el formulario manda null cuando se quita el logo.
  logoUrl: z.string().nullish(),
  leaderEmail: z.string().email(),
  leaderPassword: z.string().min(6),
});
export const updateTeamSchema = z.object({
  name: z.string().min(2).optional(),
  logoUrl: z.string().nullish(),
});
export const teamStatusSchema = z.object({ status: z.enum(['ACTIVE', 'INACTIVE']) });
export const registerTeamSchema = z.object({ competitionId: z.string().uuid() });
