import type { RequestHandler } from 'express';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';

const assertOwnTeam = async (teamId: string | null | undefined, requestedTeamId: string) => {
  if (teamId !== requestedTeamId) {
    throw new AppError(403, MESSAGES.forbidden, 'FORBIDDEN');
  }
};

/** Enforce team ownership for resources addressed by registration or roster ID. */
export const ownRegistration: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'TEAM_LEADER') return next();
  void prisma.teamRegistration
    .findUnique({ where: { id: req.params.registrationId }, select: { teamId: true } })
    .then((registration) => {
      if (!registration) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
      return assertOwnTeam(req.user?.teamId, registration.teamId);
    })
    .then(() => next(), next);
};

export const ownRosterEntry: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'TEAM_LEADER') return next();
  void prisma.rosterEntry
    .findUnique({
      where: { id: req.params.id },
      select: { teamRegistration: { select: { teamId: true } } },
    })
    .then((entry) => {
      if (!entry) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
      return assertOwnTeam(req.user?.teamId, entry.teamRegistration.teamId);
    })
    .then(() => next(), next);
};

export const ownTeam: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'TEAM_LEADER') return next();
  if (req.user.teamId !== req.params.id) {
    return next(new AppError(403, MESSAGES.forbidden, 'FORBIDDEN'));
  }
  next();
};
