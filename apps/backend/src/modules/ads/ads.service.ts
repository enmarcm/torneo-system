import { prisma } from '@/lib/prisma';

export const adsService = {
  list: (placement?: string) =>
    prisma.advertisement.findMany({
      where: placement
        ? { placement: placement as 'HOME_BANNER' | 'SIDEBAR' | 'FOOTER', active: true }
        : { active: true },
      orderBy: { sortOrder: 'asc' },
    }),

  create: (data: {
    imageUrl: string;
    linkUrl?: string;
    placement: 'HOME_BANNER' | 'SIDEBAR' | 'FOOTER';
    sortOrder?: number;
    active?: boolean;
    startDate?: Date;
    endDate?: Date;
  }) => prisma.advertisement.create({ data }),

  update: (
    id: string,
    data: Partial<{
      imageUrl: string;
      linkUrl: string;
      placement: 'HOME_BANNER' | 'SIDEBAR' | 'FOOTER';
      sortOrder: number;
      active: boolean;
      startDate: Date;
      endDate: Date;
    }>,
  ) => prisma.advertisement.update({ where: { id }, data }),

  remove: (id: string) => prisma.advertisement.delete({ where: { id } }),
};
