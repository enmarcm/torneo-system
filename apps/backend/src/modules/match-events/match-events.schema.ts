import { z } from 'zod';

export const createEventSchema = z.object({
  type: z.enum(['GOAL', 'YELLOW', 'RED', 'SUB', 'OTHER']),
  minute: z.number().int().min(0).max(130),
  teamRegistrationId: z.string().uuid(),
  playerId: z.string().uuid().optional(),
});
