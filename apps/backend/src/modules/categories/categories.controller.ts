import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { categoriesService } from './categories.service';

export const categoriesController = {
  list: asyncHandler(async (_req, res) => ok(res, await categoriesService.list())),
  create: asyncHandler(async (req, res) => created(res, await categoriesService.create(req.body))),
  update: asyncHandler(async (req, res) =>
    ok(res, await categoriesService.update(req.params.id, req.body)),
  ),
  remove: asyncHandler(async (req, res) =>
    ok(res, await categoriesService.remove(req.params.id), 'Eliminada'),
  ),
};
