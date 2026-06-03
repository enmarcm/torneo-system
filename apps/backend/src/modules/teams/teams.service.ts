import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { hashPassword } from '@/utils/password.util';
import { Prisma } from '@prisma/client';

export const teamsService = {
  list: (page = 1, limit = 50) =>
    prisma.team.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: {
        leader: { select: { email: true, status: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { name: 'asc' },
    }),

  get: async (id: string) => {
    const t = await prisma.team.findUnique({
      where: { id },
      include: {
        leader: { select: { email: true, status: true } },
        registrations: {
          include: { competition: { include: { category: true } }, roster: { include: { player: true } } },
        },
      },
    });
    if (!t) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return t;
  },

  create: async (data: {
    name: string;
    logoUrl?: string;
    leaderEmail: string;
    leaderPassword: string;
  }) => {
    const emailExists = await prisma.user.findUnique({ where: { email: data.leaderEmail } });
    if (emailExists) throw new AppError(409, 'Ya existe un usuario con ese correo', 'DUPLICATE');
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const team = await tx.team.create({
        data: { name: data.name, logoUrl: data.logoUrl ?? null },
      });
      const passwordHash = await hashPassword(data.leaderPassword);
      await tx.user.create({
        data: {
          email: data.leaderEmail,
          passwordHash,
          role: 'TEAM_LEADER',
          teamId: team.id,
        },
      });
      return team;
    });
  },

  update: (id: string, data: { name?: string; logoUrl?: string }) =>
    prisma.team.update({ where: { id }, data }),

  setStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') =>
    prisma.team.update({ where: { id }, data: { status } }),

  register: (teamId: string, competitionId: string) =>
    prisma.teamRegistration.create({ data: { teamId, competitionId } }),

  registrations: (teamId: string) =>
    prisma.teamRegistration.findMany({
      where: { teamId },
      include: {
        competition: { include: { category: true } },
        roster: { include: { player: true, stats: true } },
      },
    }),
};
