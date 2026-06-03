import { z } from 'zod';

export const createCompetitionSchema = z.object({
  editionId: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().optional(),
  format: z.enum(['LEAGUE', 'GROUPS_KNOCKOUT']).optional(),
  division: z.string().optional(),
  ageMin: z.number().int().optional(),
  ageMax: z.number().int().optional(),
  requiresAdminEligibility: z.boolean().optional(),
  minPlayers: z.number().int().optional(),
  maxPlayers: z.number().int().optional(),
  manualTeamSelection: z.boolean().optional(),
  knockoutQualifiers: z.number().int().optional(),
  numGroups: z.number().int().optional(),
  groupSize: z.number().int().optional(),
  qualifiersPerGroup: z.number().int().optional(),
});
export const updateCompetitionSchema = createCompetitionSchema.partial();
export const competitionStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'FINISHED']),
});

export type CreateCompetitionDto = z.infer<typeof createCompetitionSchema>;
