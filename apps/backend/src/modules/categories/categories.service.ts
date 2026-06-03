import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import type { CreateCategoryDto } from './categories.schema';

export const categoriesService = {
  list: () => prisma.category.findMany({ orderBy: { name: 'asc' } }),

  create: (data: CreateCategoryDto) => prisma.category.create({ data }),

  update: (id: string, data: Partial<CreateCategoryDto>) =>
    prisma.category.update({ where: { id }, data }),

  remove: async (id: string) => {
    const count = await prisma.competition.count({ where: { categoryId: id } });
    if (count > 0) {
      return prisma.category.update({ where: { id }, data: { active: false } });
    }
    try {
      await prisma.category.delete({ where: { id } });
    } catch {
      throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    }
    return { id, deleted: true };
  },
};
