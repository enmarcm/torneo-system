import { asyncHandler } from '@/utils/async-handler';
import { ok, created } from '@/utils/http.util';
import { newsService, type NewsFilters } from './news.service';
import { factSheetsService, type SheetKind } from '@/modules/fact-sheets/fact-sheets.service';
import { AppError } from '@/utils/app-error';

const SHEET_KINDS: SheetKind[] = ['EDITION_SHEET', 'COMPETITION_SHEET', 'TEAM_SHEET'];

const filtersFrom = (query: Record<string, unknown>): NewsFilters => ({
  kind: query.kind as string | undefined,
  editionId: query.editionId as string | undefined,
  competitionId: query.competitionId as string | undefined,
  teamId: query.teamId as string | undefined,
  year: query.year ? Number(query.year) : undefined,
  limit: query.limit ? Number(query.limit) : undefined,
});

export const newsController = {
  listPublic: asyncHandler(async (req, res) =>
    ok(res, await newsService.listPublic(filtersFrom(req.query))),
  ),
  getPublicBySlug: asyncHandler(async (req, res) =>
    ok(res, await newsService.getPublicBySlug(req.params.slug)),
  ),

  listAll: asyncHandler(async (req, res) => ok(res, await newsService.listAll(filtersFrom(req.query)))),
  get: asyncHandler(async (req, res) => ok(res, await newsService.get(req.params.id))),

  /**
   * Ficha de la entidad, sin guardar nada. Es lo que el panel muestra antes de
   * crear la publicación, para que el redactor vea con qué números va a salir.
   */
  preview: asyncHandler(async (req, res) => {
    const kind = req.query.kind as SheetKind;
    const entityId = req.query.entityId as string;
    if (!SHEET_KINDS.includes(kind) || !entityId) {
      throw new AppError(422, 'Indicá el tipo de ficha y la entidad', 'BAD_SHEET_REQUEST');
    }
    const year = req.query.year ? Number(req.query.year) : null;
    ok(res, await factSheetsService.build(kind, entityId, year));
  }),

  create: asyncHandler(async (req, res) =>
    created(res, await newsService.create(req.body, req.user?.id)),
  ),
  update: asyncHandler(async (req, res) => ok(res, await newsService.update(req.params.id, req.body))),
  regenerate: asyncHandler(async (req, res) =>
    ok(res, await newsService.regenerate(req.params.id), 'Ficha actualizada'),
  ),
  remove: asyncHandler(async (req, res) =>
    ok(res, await newsService.remove(req.params.id), 'Eliminado'),
  ),
};
