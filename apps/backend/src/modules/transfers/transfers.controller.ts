import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { transfersService } from './transfers.service';

export const transfersController = {
  list: asyncHandler(async (req, res) =>
    ok(res, await transfersService.list(req.query.editionId as string | undefined)),
  ),
  create: asyncHandler(async (req, res) => created(res, await transfersService.create(req.body))),
  setStatus: asyncHandler(async (req, res) =>
    ok(res, await transfersService.setStatus(req.params.id, req.body.status)),
  ),
};
