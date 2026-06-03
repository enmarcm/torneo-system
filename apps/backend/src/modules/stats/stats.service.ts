import { prisma } from '@/lib/prisma';

export const statsService = {
  players: (filters: { competitionId?: string; teamId?: string; playerId?: string }) =>
    prisma.playerSeasonStats.findMany({
      where: {
        rosterEntry: {
          ...(filters.playerId ? { playerId: filters.playerId } : {}),
          teamRegistration: {
            ...(filters.competitionId ? { competitionId: filters.competitionId } : {}),
            ...(filters.teamId ? { teamId: filters.teamId } : {}),
          },
        },
      },
      include: {
        rosterEntry: {
          include: { player: true, teamRegistration: { include: { team: true } } },
        },
      },
      orderBy: [{ goals: 'desc' }, { assists: 'desc' }],
      take: 100,
    }),
};
