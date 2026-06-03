import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import type { CreateEditionDto, UpdateEditionDto } from './editions.schema';

export const editionsService = {
  list: () => prisma.edition.findMany({ orderBy: { createdAt: 'desc' } }),

  get: async (id: string) => {
    const e = await prisma.edition.findUnique({
      where: { id },
      include: { competitions: { include: { category: true } } },
    });
    if (!e) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return e;
  },

  create: (data: CreateEditionDto) => prisma.edition.create({ data }),

  update: (id: string, data: UpdateEditionDto) => prisma.edition.update({ where: { id }, data }),

  setStatus: (id: string, status: 'DRAFT' | 'ACTIVE' | 'FINISHED') =>
    prisma.edition.update({ where: { id }, data: { status } }),

  setTransfers: (
    id: string,
    data: { transfersOpen: boolean; transferWindowStart?: Date; transferWindowEnd?: Date },
  ) => prisma.edition.update({ where: { id }, data }),
};
