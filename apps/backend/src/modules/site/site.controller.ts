import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { siteService } from './site.service';

export const siteController = {
  publicSite: asyncHandler(async (_req, res) => ok(res, await siteService.publicSite())),
  publicLegalPage: asyncHandler(async (req, res) =>
    ok(res, await siteService.publicLegalPage(req.params.slug)),
  ),

  getSettings: asyncHandler(async (_req, res) => ok(res, await siteService.getSettings())),
  updateSettings: asyncHandler(async (req, res) =>
    ok(res, await siteService.updateSettings(req.body), 'Configuración guardada'),
  ),

  listLegalPages: asyncHandler(async (_req, res) => ok(res, await siteService.listLegalPages())),
  createLegalPage: asyncHandler(async (req, res) =>
    created(res, await siteService.createLegalPage(req.body)),
  ),
  updateLegalPage: asyncHandler(async (req, res) =>
    ok(res, await siteService.updateLegalPage(req.params.id, req.body)),
  ),
  removeLegalPage: asyncHandler(async (req, res) =>
    ok(res, await siteService.removeLegalPage(req.params.id, req.user?.id), 'Eliminado'),
  ),
};
