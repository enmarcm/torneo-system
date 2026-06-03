import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { matchEventsService } from './match-events.service';

export const matchEventsController = {
  create: asyncHandler(async (req, res) =>
    created(res, await matchEventsService.create(req.params.id, req.body)),
  ),
  remove: asyncHandler(async (req, res) =>
    ok(res, await matchEventsService.remove(req.params.id), 'Eliminado'),
  ),
};
