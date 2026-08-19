import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { adsService } from './ads.service';

export const adsController = {
  list: asyncHandler(async (req, res) =>
    ok(res, await adsService.listPublic(req.query.placement as string | undefined)),
  ),
  /** Panel de administración: hace falta ver también lo apagado y lo vencido. */
  listAll: asyncHandler(async (_req, res) => ok(res, await adsService.listAll())),
  create: asyncHandler(async (req, res) => created(res, await adsService.create(req.body))),
  update: asyncHandler(async (req, res) =>
    ok(res, await adsService.update(req.params.id, req.body)),
  ),
  remove: asyncHandler(async (req, res) =>
    ok(res, await adsService.remove(req.params.id), 'Eliminado'),
  ),
};
