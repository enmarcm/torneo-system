import { z } from 'zod';

export const createLeagueSystemSchema = z.object({
  editionId: z.string().uuid(),
  name: z.string().min(2),
});

export const updateLeagueSystemSchema = z.object({
  name: z.string().min(2).optional(),
});

export const attachDivisionSchema = z.object({
  competitionId: z.string().uuid(),
  divisionLevel: z.number().int().min(1).max(10),
});

export const attachCupSchema = z.object({
  competitionId: z.string().uuid(),
});
