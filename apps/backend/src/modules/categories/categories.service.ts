import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { purgeCompetitions, CASCADE_TX } from '@/utils/cascade.util';
import type { CreateCategoryDto } from './categories.schema';

export const categoriesService = {
  list: () => prisma.category.findMany({ orderBy: { name: 'asc' } }),

  create: (data: CreateCategoryDto) => prisma.category.create({ data }),

  update: (id: string, data: Partial<CreateCategoryDto>) =>
    prisma.category.update({ where: { id }, data }),

  /**
   * Borrado definitivo y en cascada: se lleva las competiciones que la usan y
   * todo lo que cuelga de ellas. Nunca se desactiva en silencio.
   */
  remove: async (id: string) => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

    return prisma.$transaction(
      async (tx) => {
        const competitions = await tx.competition.findMany({
          where: { categoryId: id },
          select: { id: true },
        });
        await purgeCompetitions(tx, competitions.map((c) => c.id));
        await tx.category.delete({ where: { id } });
        return { id, deleted: true };
      },
      CASCADE_TX,
    );
  },
};
