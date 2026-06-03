import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import type { CreateCompetitionDto } from './competitions.schema';

export const competitionsService = {
  list: (editionId?: string) =>
    prisma.competition.findMany({
      where: editionId ? { editionId } : {},
      include: { category: true, _count: { select: { registrations: true, matches: true } } },
      orderBy: { createdAt: 'desc' },
    }),

  get: async (id: string) => {
    const c = await prisma.competition.findUnique({
      where: { id },
      include: {
        category: true,
        groups: { include: { registrations: { include: { team: true } } } },
        registrations: { include: { team: true, roster: { include: { player: true } } } },
      },
    });
    if (!c) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return c;
  },

  create: async (d: CreateCompetitionDto) => {
    const cat = await prisma.category.findUnique({ where: { id: d.categoryId } });
    if (!cat) throw new AppError(404, 'Categoría no encontrada', 'NOT_FOUND');
    return prisma.competition.create({
      data: {
        editionId: d.editionId,
        categoryId: d.categoryId,
        name: d.name ?? cat.name,
        format: d.format ?? cat.defaultFormat,
        division: d.division ?? null,
        ageMin: d.ageMin ?? cat.defaultAgeMin,
        ageMax: d.ageMax ?? cat.defaultAgeMax,
        requiresAdminEligibility: d.requiresAdminEligibility ?? cat.defaultRequiresAdminEligibility,
        minPlayers: d.minPlayers ?? cat.defaultMinPlayers,
        maxPlayers: d.maxPlayers ?? cat.defaultMaxPlayers,
        manualTeamSelection: d.manualTeamSelection ?? cat.defaultFormat === 'GROUPS_KNOCKOUT',
        knockoutQualifiers: d.knockoutQualifiers ?? null,
        numGroups: d.numGroups ?? null,
        groupSize: d.groupSize ?? null,
        qualifiersPerGroup: d.qualifiersPerGroup ?? null,
      },
    });
  },

  update: (id: string, data: Partial<CreateCompetitionDto>) =>
    prisma.competition.update({ where: { id }, data }),

  setStatus: (id: string, status: 'DRAFT' | 'ACTIVE' | 'FINISHED') =>
    prisma.competition.update({ where: { id }, data: { status } }),
};
