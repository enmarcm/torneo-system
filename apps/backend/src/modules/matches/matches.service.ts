import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { getIo } from '@/lib/socket';
import { Prisma } from '@prisma/client';
import type { CreateMatchDto } from './matches.schema';

const teamInclude = { team: true };

export const matchesService = {
  list: (competitionId?: string, status?: string, page = 1, limit = 50) =>
    prisma.match.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: {
        ...(competitionId ? { competitionId } : {}),
        ...(status ? { status: status as 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' } : {}),
      },
      include: {
        homeRegistration: { include: teamInclude },
        awayRegistration: { include: teamInclude },
      },
      orderBy: { scheduledAt: 'asc' },
    }),
  count: (competitionId?: string, status?: string) =>
    prisma.match.count({
      where: {
        ...(competitionId ? { competitionId } : {}),
        ...(status ? { status: status as 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' } : {}),
      },
    }),

  get: async (id: string) => {
    const m = await prisma.match.findUnique({
      where: { id },
      include: {
        homeRegistration: { include: teamInclude },
        awayRegistration: { include: teamInclude },
        events: { include: { player: true }, orderBy: { minute: 'desc' } },
      },
    });
    if (!m) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return m;
  },

  create: (data: CreateMatchDto) => prisma.match.create({ data }),

  update: (id: string, data: Partial<CreateMatchDto>) =>
    prisma.match.update({ where: { id }, data }),

  start: async (id: string) => {
    const m = await prisma.match.update({ where: { id }, data: { status: 'LIVE' } });
    getIo()
      .to(`match:${id}`)
      .emit('match:update', { matchId: id, status: 'LIVE', homeScore: m.homeScore, awayScore: m.awayScore });
    return m;
  },

  finish: async (id: string) =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const match = await tx.match.findUnique({ where: { id }, include: { events: true } });
      if (!match) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
      await tx.match.update({ where: { id }, data: { status: 'FINISHED' } });

      const goals: Record<string, number> = {};
      const yellows: Record<string, number> = {};
      const reds: Record<string, number> = {};
      for (const ev of match.events) {
        if (!ev.playerId) continue;
        if (ev.type === 'GOAL') goals[ev.playerId] = (goals[ev.playerId] || 0) + 1;
        if (ev.type === 'YELLOW') yellows[ev.playerId] = (yellows[ev.playerId] || 0) + 1;
        if (ev.type === 'RED') reds[ev.playerId] = (reds[ev.playerId] || 0) + 1;
      }
      const regs = [match.homeRegistrationId, match.awayRegistrationId];
      const roster = await tx.rosterEntry.findMany({
        where: { teamRegistrationId: { in: regs }, status: 'ACTIVE' },
      });
      for (const re of roster) {
        const g = goals[re.playerId] || 0;
        const y = yellows[re.playerId] || 0;
        const r = reds[re.playerId] || 0;
        await tx.playerSeasonStats.upsert({
          where: { rosterEntryId: re.id },
          update: {
            matchesPlayed: { increment: 1 },
            goals: { increment: g },
            yellowCards: { increment: y },
            redCards: { increment: r },
          },
          create: {
            rosterEntryId: re.id,
            matchesPlayed: 1,
            goals: g,
            yellowCards: y,
            redCards: r,
          },
        });
      }
      getIo()
        .to(`match:${id}`)
        .emit('match:update', {
          matchId: id,
          status: 'FINISHED',
          homeScore: match.homeScore,
          awayScore: match.awayScore,
        });
      return tx.match.findUnique({ where: { id } });
    }),

  remove: (id: string) => prisma.match.delete({ where: { id } }),
};
