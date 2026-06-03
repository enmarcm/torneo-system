import { Router } from 'express';
import { standingsController } from './standings.controller';

export const standingsRouter = Router();
standingsRouter.get('/', standingsController.byCompetition);
