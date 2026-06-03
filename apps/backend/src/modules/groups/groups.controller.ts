import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { groupsService } from './groups.service';

export const groupsController = {
  generate: asyncHandler(async (req, res) =>
    created(res, await groupsService.generate(req.params.competitionId, req.body.numGroups)),
  ),
  list: asyncHandler(async (req, res) =>
    ok(res, await groupsService.list(req.params.competitionId)),
  ),
  assignTeams: asyncHandler(async (req, res) =>
    ok(res, await groupsService.assignTeams(req.params.id, req.body.registrationIds)),
  ),
};
