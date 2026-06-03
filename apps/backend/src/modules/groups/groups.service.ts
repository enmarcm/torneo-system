import { prisma } from '@/lib/prisma';

const LETTERS = 'ABCDEFGHIJKLMNOP';

export const groupsService = {
  generate: async (competitionId: string, numGroups: number) => {
    await prisma.competitionGroup.deleteMany({ where: { competitionId } });
    const data = Array.from({ length: numGroups }, (_, i) => ({
      competitionId,
      name: `Grupo ${LETTERS[i]}`,
    }));
    await prisma.competitionGroup.createMany({ data });
    return prisma.competitionGroup.findMany({
      where: { competitionId },
      orderBy: { name: 'asc' },
    });
  },

  list: (competitionId: string) =>
    prisma.competitionGroup.findMany({
      where: { competitionId },
      include: { registrations: { include: { team: true } } },
      orderBy: { name: 'asc' },
    }),

  assignTeams: async (groupId: string, registrationIds: string[]) => {
    await prisma.teamRegistration.updateMany({
      where: { id: { in: registrationIds } },
      data: { groupId },
    });
    return prisma.competitionGroup.findUnique({
      where: { id: groupId },
      include: { registrations: { include: { team: true } } },
    });
  },
};
