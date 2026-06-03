import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { rostersService } from './rosters.service';

export const rostersController = {
  list: asyncHandler(async (req, res) =>
    ok(res, await rostersService.list(req.params.registrationId)),
  ),
  add: asyncHandler(async (req, res) =>
    created(
      res,
      await rostersService.add(req.params.registrationId, req.body.playerId, req.body.jerseyNumber),
    ),
  ),
  setEligibility: asyncHandler(async (req, res) =>
    ok(res, await rostersService.setEligibility(req.params.id, req.body.eligibilityApproved)),
  ),
  update: asyncHandler(async (req, res) =>
    ok(res, await rostersService.update(req.params.id, req.body)),
  ),
  remove: asyncHandler(async (req, res) => ok(res, await rostersService.remove(req.params.id), 'Quitado')),
};
