import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/role.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { asyncHandler } from '@/utils/async-handler';
import { ok } from '@/utils/http.util';
import { historyService } from './history.service';
import { historyFiltersSchema, historyIdSchema, type HistoryFilters } from './history.schema';

export const historyRouter = Router();
historyRouter.use(authMiddleware, requireRole('ADMIN'), validate(historyFiltersSchema, 'query'));
historyRouter.get('/players', asyncHandler(async (req, res) => ok(res, await historyService.report('players', req.query as unknown as HistoryFilters))));
historyRouter.get('/teams', asyncHandler(async (req, res) => ok(res, await historyService.report('teams', req.query as unknown as HistoryFilters))));
historyRouter.get('/players/:id', validate(historyIdSchema, 'params'), asyncHandler(async (req, res) => ok(res, await historyService.player(req.params.id, req.query as unknown as HistoryFilters))));
historyRouter.get('/teams/:id', validate(historyIdSchema, 'params'), asyncHandler(async (req, res) => ok(res, await historyService.team(req.params.id, req.query as unknown as HistoryFilters))));
