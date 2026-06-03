import { z } from 'zod';

export const addRosterSchema = z.object({
  playerId: z.string().uuid(),
  jerseyNumber: z.number().int().optional(),
});
export const updateRosterSchema = z.object({
  jerseyNumber: z.number().int().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
export const eligibilitySchema = z.object({ eligibilityApproved: z.boolean() });
