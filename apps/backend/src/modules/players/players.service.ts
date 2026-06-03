import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import type { CreatePlayerDto } from './players.schema';

export const playersService = {
  list: (search?: string) =>
    prisma.player.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { documentNumber: { contains: search } },
            ],
          }
        : {},
      orderBy: { lastName: 'asc' },
      take: 50,
    }),

  byDocument: (documentType: 'CEDULA' | 'PARTIDA', documentNumber: string) =>
    prisma.player.findUnique({
      where: { documentType_documentNumber: { documentType, documentNumber } },
    }),

  get: async (id: string) => {
    const p = await prisma.player.findUnique({ where: { id } });
    if (!p) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return p;
  },

  create: async (data: CreatePlayerDto) => {
    const exists = await prisma.player.findUnique({
      where: {
        documentType_documentNumber: {
          documentType: data.documentType,
          documentNumber: data.documentNumber,
        },
      },
    });
    if (exists) throw new AppError(409, MESSAGES.duplicatePlayer, 'DUPLICATE');
    return prisma.player.create({ data });
  },

  update: (id: string, data: Partial<CreatePlayerDto>) =>
    prisma.player.update({ where: { id }, data }),

  setStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') =>
    prisma.player.update({ where: { id }, data: { status } }),

  setDegree: (id: string, data: { universityDegreeVerified: boolean; degreeDocUrl?: string }) =>
    prisma.player.update({ where: { id }, data }),

  competitions: (id: string) =>
    prisma.rosterEntry.findMany({
      where: { playerId: id },
      include: {
        teamRegistration: { include: { team: true, competition: { include: { category: true } } } },
        stats: true,
      },
    }),
};
