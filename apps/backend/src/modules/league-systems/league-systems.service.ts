import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';

const systemInclude = {
  divisions: {
    include: { _count: { select: { registrations: true } } },
    orderBy: { divisionLevel: 'asc' },
  },
  cups: true,
} as const;

export const leagueSystemsService = {
  list: (editionId?: string) =>
    prisma.leagueSystem.findMany({
      where: editionId ? { editionId } : {},
      include: systemInclude,
      orderBy: { createdAt: 'asc' },
    }),

  get: async (id: string) => {
    const system = await prisma.leagueSystem.findUnique({
      where: { id },
      include: systemInclude,
    });
    if (!system) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return system;
  },

  create: (data: { editionId: string; name: string; ageGroup?: 'ADULT' | 'YOUTH' }) =>
    prisma.leagueSystem.create({ data, include: systemInclude }),

  update: (id: string, data: { name?: string }) =>
    prisma.leagueSystem.update({ where: { id }, data, include: systemInclude }),

  /**
   * Engancha una división (Primera/Segunda/Tercera) al sistema y le fija el nivel.
   * El nivel ordena el ascenso y el descenso: 1 está por encima de 2.
   */
  attachDivision: async (id: string, competitionId: string, divisionLevel: number) => {
    const system = await prisma.leagueSystem.findUnique({ where: { id } });
    if (!system) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    if (competition.editionId !== system.editionId) {
      throw new AppError(422, 'La competición es de otra edición', 'EDITION_MISMATCH');
    }
    if (competition.ageGroup !== system.ageGroup) {
      throw new AppError(422, 'La competición es de otro apartado', 'AGE_GROUP_MISMATCH');
    }
    return prisma.competition.update({
      where: { id: competitionId },
      data: { leagueSystemId: id, sourceLeagueSystemId: null, divisionLevel, kind: 'LEAGUE_DIVISION', format: 'LEAGUE' },
    });
  },

  /** Marca de qué sistema de liga saca sus equipos una copa. */
  attachCup: async (id: string, competitionId: string) => {
    const system = await prisma.leagueSystem.findUnique({ where: { id } });
    if (!system) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    if (competition.editionId !== system.editionId || competition.ageGroup !== system.ageGroup) {
      throw new AppError(422, 'La copa debe ser de la misma edición y apartado', 'LEAGUE_SCOPE_MISMATCH');
    }
    return prisma.competition.update({
      where: { id: competitionId },
      data: { sourceLeagueSystemId: id, leagueSystemId: null, divisionLevel: null, kind: 'CUP', format: 'GROUPS_KNOCKOUT' },
    });
  },

  detach: async (competitionId: string) => {
    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return prisma.competition.update({
      where: { id: competitionId },
      data: {
        leagueSystemId: null, sourceLeagueSystemId: null, divisionLevel: null, division: null,
        promotionSpots: 0, relegationSpots: 0,
        ...(competition.kind === 'LEAGUE_DIVISION' ? { kind: 'STANDALONE_LEAGUE', format: 'LEAGUE', knockoutQualifiers: null, twoLeggedStages: [] } : {}),
      },
    });
  },

  /**
   * Equipos disponibles para inscribir en la copa: los que juegan cualquiera de
   * las divisiones del sistema. El admin elige a dedo cuáles entran.
   */
  eligibleForCup: async (id: string) => {
    const divisions = await prisma.competition.findMany({
      where: { leagueSystemId: id },
      select: { id: true, name: true, divisionLevel: true },
    });
    if (divisions.length === 0) return [];
    const regs = await prisma.teamRegistration.findMany({
      where: { competitionId: { in: divisions.map((d) => d.id) }, status: 'ACTIVE' },
      include: { team: true, competition: { select: { id: true, name: true, divisionLevel: true } } },
    });
    return regs.map((r) => ({
      teamId: r.teamId,
      teamName: r.team.name,
      logoUrl: r.team.logoUrl,
      divisionId: r.competition.id,
      divisionName: r.competition.name,
      divisionLevel: r.competition.divisionLevel,
    }));
  },
};
