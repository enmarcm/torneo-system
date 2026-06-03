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

  history: async (id: string) => {
    const team = await prisma.team.findUnique({ where: { id }, select: { id: true } });
    if (!team) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    const regs = await prisma.teamRegistration.findMany({
      where: { teamId: id },
      select: { id: true },
    });
    const regIds = regs.map((r) => r.id);
    if (regIds.length === 0) return [];
    return prisma.match.findMany({
      where: {
        OR: [{ homeRegistrationId: { in: regIds } }, { awayRegistrationId: { in: regIds } }],
      },
      include: {
        homeRegistration: { include: { team: true } },
        awayRegistration: { include: { team: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  },

  stats: async (id: string) => {
    const team = await prisma.team.findUnique({ where: { id }, select: { id: true } });
    if (!team) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    const regs = await prisma.teamRegistration.findMany({
      where: { teamId: id },
      select: { id: true },
    });
    const regIds = regs.map((r) => r.id);
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ homeRegistrationId: { in: regIds } }, { awayRegistrationId: { in: regIds } }],
        status: 'FINISHED',
      },
    });
    const totalPlayed = matches.length;
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    for (const m of matches) {
      const isHome = regIds.includes(m.homeRegistrationId);
      const gf = isHome ? m.homeScore : m.awayScore;
      const ga = isHome ? m.awayScore : m.homeScore;
      goalsFor += gf;
      goalsAgainst += ga;
      if (gf > ga) wins++;
      else if (gf < ga) losses++;
      else draws++;
    }
    return { totalPlayed, wins, losses, draws, goalsFor, goalsAgainst, winRate: totalPlayed > 0 ? wins / totalPlayed : 0 };
  },

  players: async (id: string) => {
    const team = await prisma.team.findUnique({ where: { id }, select: { id: true } });
    if (!team) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return prisma.rosterEntry.findMany({
      where: { teamRegistration: { teamId: id }, status: 'ACTIVE' },
      include: {
        player: true,
        teamRegistration: { include: { competition: true } },
        stats: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
