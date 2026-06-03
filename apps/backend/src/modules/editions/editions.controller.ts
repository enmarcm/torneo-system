import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { editionsService } from './editions.service';

export const editionsController = {
  list: asyncHandler(async (_req, res) => ok(res, await editionsService.list())),
  get: asyncHandler(async (req, res) => ok(res, await editionsService.get(req.params.id))),
  create: asyncHandler(async (req, res) => created(res, await editionsService.create(req.body))),
  update: asyncHandler(async (req, res) =>
    ok(res, await editionsService.update(req.params.id, req.body)),
  ),
  setStatus: asyncHandler(async (req, res) =>
    ok(res, await editionsService.setStatus(req.params.id, req.body.status)),
  ),
  setTransfers: asyncHandler(async (req, res) =>
    ok(res, await editionsService.setTransfers(req.params.id, req.body)),
  ),
};
