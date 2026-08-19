import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { purgeCompetitions, CASCADE_TX } from '@/utils/cascade.util';
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

  /**
   * Borrado definitivo y en cascada: la edición se lleva sus competiciones
   * enteras (partidos, tablas, plantillas y estadísticas) y sus traspasos.
   */
  remove: async (id: string) => {
    const edition = await prisma.edition.findUnique({ where: { id } });
    if (!edition) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

    return prisma.$transaction(
      async (tx) => {
        const competitions = await tx.competition.findMany({
          where: { editionId: id },
          select: { id: true },
        });
        await purgeCompetitions(tx, competitions.map((c) => c.id));
        await tx.transfer.deleteMany({ where: { editionId: id } });
        // La liga de la edición se crea sola y no tiene valor sin ella.
        await tx.leagueSystem.deleteMany({ where: { editionId: id } });
        await tx.edition.delete({ where: { id } });
        return { id };
      },
      CASCADE_TX,
    );
  },
};
