import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { assertDeletable } from '@/utils/deletion.util';
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
   * Borrado definitivo. Solo si la edición está vacía: si tiene competiciones,
   * borrarla se llevaría toda la temporada (partidos, tablas y estadísticas).
   */
  remove: async (id: string) => {
    const edition = await prisma.edition.findUnique({ where: { id } });
    if (!edition) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

    const [competitions, transfers] = await Promise.all([
      prisma.competition.count({ where: { editionId: id } }),
      prisma.transfer.count({ where: { editionId: id } }),
    ]);
    assertDeletable('la edición', [
      { label: 'competiciones', count: competitions },
      { label: 'traspasos', count: transfers },
    ]);

    return prisma.$transaction(async (tx) => {
      // La liga de la edición se crea sola y no tiene valor sin ella.
      await tx.leagueSystem.deleteMany({ where: { editionId: id } });
      await tx.edition.delete({ where: { id } });
      return { id };
    });
  },
};
