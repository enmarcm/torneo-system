import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { competitionsService } from './competitions.service';

export const competitionsController = {
  list: asyncHandler(async (req, res) =>
    ok(res, await competitionsService.list(req.query.editionId as string | undefined)),
  ),
  get: asyncHandler(async (req, res) => ok(res, await competitionsService.get(req.params.id))),
  create: asyncHandler(async (req, res) => created(res, await competitionsService.create(req.body))),
  update: asyncHandler(async (req, res) =>
    ok(res, await competitionsService.update(req.params.id, req.body)),
  ),
  setStatus: asyncHandler(async (req, res) =>
    ok(res, await competitionsService.setStatus(req.params.id, req.body.status)),
  ),
};
