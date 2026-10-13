import { z } from 'zod';
import { createPlayerSchema } from '../players/players.schema';

export const addRosterSchema = z.object({
  playerId: z.string().uuid(),
  jerseyNumber: z.number().int().optional(),
});
export const updateRosterSchema = z.object({
  jerseyNumber: z.number().int().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
export const eligibilitySchema = z.object({ eligibilityApproved: z.boolean() });


export const createRosterPlayerSchema = createPlayerSchema.extend({
  birthDate: z.coerce.date().refine((date) => date <= new Date(), 'La fecha de nacimiento no puede ser futura'),
  jerseyNumber: z.number().int().min(0).max(999).optional(),
});
export type CreateRosterPlayerDto = z.infer<typeof createRosterPlayerSchema>;
