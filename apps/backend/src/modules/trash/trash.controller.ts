import type { TrashKind } from '@prisma/client';
import { asyncHandler } from '@/utils/async-handler';
import { ok } from '@/utils/http.util';
import { trashService } from './trash.service';

export const trashController = {
  list: asyncHandler(async (req, res) => {
    const { rows, total, page, limit, counts } = await trashService.list({
      kind: req.query.kind as TrashKind | undefined,
      search: (req.query.search as string | undefined)?.trim() || undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    ok(res, rows, 'OK', { total, page, limit, counts });
  }),
  get: asyncHandler(async (req, res) => ok(res, await trashService.get(req.params.id))),
  restore: asyncHandler(async (req, res) =>
    ok(res, await trashService.restore(req.params.id), 'Restaurado'),
  ),
  purge: asyncHandler(async (req, res) =>
    ok(res, await trashService.purge(req.params.id), 'Eliminado definitivamente'),
  ),
  empty: asyncHandler(async (req, res) =>
    ok(res, await trashService.empty(req.query.kind as TrashKind | undefined), 'Papelera vaciada'),
  ),
};
