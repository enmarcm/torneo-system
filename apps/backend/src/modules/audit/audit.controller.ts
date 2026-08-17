import { asyncHandler } from '@/utils/async-handler';
import { ok } from '@/utils/http.util';
import { auditService } from './audit.service';

export const auditController = {
  list: asyncHandler(async (req, res) => {
    const { rows, total, page, limit } = await auditService.list({
      entity: req.query.entity as string | undefined,
      action: req.query.action as string | undefined,
      userId: req.query.userId as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    ok(res, rows, 'OK', { total, page, limit });
  }),
  facets: asyncHandler(async (_req, res) => ok(res, await auditService.facets())),
};
