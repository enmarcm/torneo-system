import { prisma } from '@/lib/prisma';

export const statsService = {
  players: (filters: {
    competitionId?: string;
    /** Acota a todas las competiciones de una edición. */
    editionId?: string;
    teamId?: string;
    playerId?: string;
  }) =>
    prisma.playerSeasonStats.findMany({
      where: {
        rosterEntry: {
          ...(filters.playerId ? { playerId: filters.playerId } : {}),
          teamRegistration: {
            ...(filters.competitionId ? { competitionId: filters.competitionId } : {}),
            ...(filters.editionId ? { competition: { editionId: filters.editionId } } : {}),
            ...(filters.teamId ? { teamId: filters.teamId } : {}),
          },
        },
      },
      include: {
        rosterEntry: {
          include: {
            player: true,
            teamRegistration: {
              include: {
                team: true,
                // La tabla pública agrupa por competición, así que cada línea
                // tiene que saber de qué torneo sale.
                competition: {
                  select: {
                    id: true,
                    name: true,
                    kind: true,
                    format: true,
                    division: true,
                    divisionLevel: true,
                    editionId: true,
                    category: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ goals: 'desc' }, { assists: 'desc' }],
      take: 200,
    }),
};
