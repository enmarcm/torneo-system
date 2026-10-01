import { prisma } from '@/lib/prisma';

export const statsService = {
  playersPublic: (filters: { competitionId?: string; editionId?: string }) =>
    prisma.playerSeasonStats.findMany({
      where: {
        rosterEntry: {
          status: 'ACTIVE',
          teamRegistration: {
            status: 'ACTIVE',
            ...(filters.competitionId ? { competitionId: filters.competitionId } : {}),
            ...(filters.editionId ? { competition: { editionId: filters.editionId } } : {}),
          },
        },
      },
      select: {
        id: true, matchesPlayed: true, goals: true, assists: true, yellowCards: true, redCards: true, minutesPlayed: true,
        rosterEntry: {
          select: {
            id: true,
            player: { select: { id: true, firstName: true, lastName: true, photoUrl: true, position: true } },
            teamRegistration: {
              select: {
                id: true, competitionId: true,
                team: { select: { id: true, name: true, logoUrl: true } },
                competition: { select: { id: true, name: true, kind: true, format: true, division: true, divisionLevel: true, editionId: true, category: { select: { id: true, name: true } } } },
              },
            },
          },
        },
      },
      orderBy: [{ goals: 'desc' }, { assists: 'desc' }],
      take: 200,
    }),

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
            player: { select: { id: true, firstName: true, lastName: true, photoUrl: true, position: true } },
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
