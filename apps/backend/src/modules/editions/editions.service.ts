import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { purgeCompetitions } from '@/utils/cascade.util';
import { trashService } from '@/modules/trash/trash.service';
import type { CreateEditionDto, UpdateEditionDto } from './editions.schema';

export const editionsService = {
  list: () => prisma.edition.findMany({ orderBy: { createdAt: 'desc' } }),

  get: async (id: string) => {
    const e = await prisma.edition.findUnique({
      where: { id },
      include: { competitions: true },
    });
    if (!e) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return e;
  },

  create: (data: CreateEditionDto) => prisma.edition.create({ data }),

  update: (id: string, data: UpdateEditionDto) => prisma.edition.update({ where: { id }, data }),

  setStatus: (id: string, status: 'DRAFT' | 'ACTIVE' | 'FINISHED') =>
    prisma.edition.update({ where: { id }, data: { status } }),

  /**
   * Borrado definitivo y en cascada: la edición se lleva sus competiciones
   * enteras (partidos, tablas, plantillas y estadísticas).
   */
  remove: async (id: string, actorId?: string) => {
    const edition = await prisma.edition.findUnique({ where: { id } });
    if (!edition) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

    return trashService.withTrash('EDITION', id, actorId, async (tx) => {
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
    });
  },
};
