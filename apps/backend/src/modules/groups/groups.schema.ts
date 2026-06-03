import { z } from 'zod';

export const generateGroupsSchema = z.object({ numGroups: z.number().int().min(1).max(16) });
export const assignTeamsSchema = z.object({ registrationIds: z.array(z.string().uuid()) });
