import { z } from 'zod';
import { asyncHandler } from '@/utils/async-handler';
import { fail, ok } from '@/utils/http.util';
import { standingsService } from './standings.service';

const querySchema = z.object({
  competitionId: z.string().uuid(),
  groupId: z.string().uuid().optional(),
});

export const standingsController = {
  byCompetition: asyncHandler(async (req, res) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) return fail(res, parsed.error.errors[0]?.message ?? 'Invalid query', 400);
    ok(res, await standingsService.byCompetition(parsed.data.competitionId, parsed.data.groupId));
  }),
};
