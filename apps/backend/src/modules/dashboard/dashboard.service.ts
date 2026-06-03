import { prisma } from '@/lib/prisma';

export const dashboardService = {
  metrics: async (editionId: string) => {
    const competitions = await prisma.competition.findMany({
      where: { editionId },
      select: { id: true },
    });
    const compIds = competitions.map((c: { id: string }) => c.id);
    const [teams, players, matchesPlayed, matchesLive, matchesScheduled] = await Promise.all([
      prisma.teamRegistration.count({ where: { competitionId: { in: compIds } } }),
      prisma.rosterEntry.count({
        where: { teamRegistration: { competitionId: { in: compIds } }, status: 'ACTIVE' },
      }),
      prisma.match.count({ where: { competitionId: { in: compIds }, status: 'FINISHED' } }),
      prisma.match.count({ where: { competitionId: { in: compIds }, status: 'LIVE' } }),
      prisma.match.count({ where: { competitionId: { in: compIds }, status: 'SCHEDULED' } }),
    ]);
    return {
      competitions: compIds.length,
      teams,
      players,
      matchesPlayed,
      matchesLive,
      matchesScheduled,
    };
  },
};
