import { z } from 'zod';

export const createCompetitionSchema = z.object({
  editionId: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().optional(),
  format: z.enum(['LEAGUE', 'GROUPS_KNOCKOUT']).optional(),
  kind: z.enum(['LEAGUE_DIVISION', 'CUP', 'YOUTH', 'SPECIAL']).optional(),
  imageUrl: z.string().optional(),
  division: z.string().optional(),
  divisionLevel: z.number().int().min(1).max(10).nullable().optional(),
  leagueSystemId: z.string().uuid().nullable().optional(),
  sourceLeagueSystemId: z.string().uuid().nullable().optional(),
  ageMin: z.number().int().optional(),
  ageMax: z.number().int().optional(),
  requiresAdminEligibility: z.boolean().optional(),
  minPlayers: z.number().int().optional(),
  maxPlayers: z.number().int().optional(),
  manualTeamSelection: z.boolean().optional(),
  rounds: z.number().int().min(1).max(4).optional(),
  twoLeggedStages: z.array(z.enum(['R16', 'QUARTER', 'SEMI', 'THIRD', 'FINAL'])).optional(),
  promotionSpots: z.number().int().min(0).optional(),
  relegationSpots: z.number().int().min(0).optional(),
  knockoutQualifiers: z.number().int().optional(),
  numGroups: z.number().int().optional(),
  groupSize: z.number().int().optional(),
  qualifiersPerGroup: z.number().int().optional(),
});
export const updateCompetitionSchema = createCompetitionSchema.partial();
export const competitionStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'FINISHED']),
});

/** Ascenso, descenso o baja: lo decide el admin, no la posición en la tabla. */
export const registrationOutcomeSchema = z.object({
  outcome: z.enum(['NONE', 'PROMOTED', 'RELEGATED', 'WITHDRAWN']),
  outcomeNote: z.string().optional(),
});

export type CreateCompetitionDto = z.infer<typeof createCompetitionSchema>;
