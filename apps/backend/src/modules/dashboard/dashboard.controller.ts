import { asyncHandler } from '@/utils/async-handler';
import { ok } from '@/utils/http.util';
import { dashboardService } from './dashboard.service';

export const dashboardController = {
  metrics: asyncHandler(async (req, res) =>
    ok(res, await dashboardService.metrics(req.query.editionId as string)),
  ),
};
