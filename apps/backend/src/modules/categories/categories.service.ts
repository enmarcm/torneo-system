import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { assertDeletable } from '@/utils/deletion.util';
import type { CreateCategoryDto } from './categories.schema';

export const categoriesService = {
  list: () => prisma.category.findMany({ orderBy: { name: 'asc' } }),

  create: (data: CreateCategoryDto) => prisma.category.create({ data }),

  update: (id: string, data: Partial<CreateCategoryDto>) =>
    prisma.category.update({ where: { id }, data }),

  /**
   * Borrado definitivo. Antes, si la categoría tenía competiciones, se
   * desactivaba en silencio: el admin apretaba "Eliminar" y creía haber
   * borrado algo que seguía existiendo. Ahora se avisa explícitamente.
   */
  remove: async (id: string) => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

    const competitions = await prisma.competition.count({ where: { categoryId: id } });
    assertDeletable('la categoría', [
      { label: 'competiciones que la usan', count: competitions },
    ]);

    await prisma.category.delete({ where: { id } });
    return { id, deleted: true };
  },
};
