import { prisma } from '@/lib/prisma';
import type { AdPlacement, Prisma } from '@prisma/client';

export interface AdInput {
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  placements: AdPlacement[];
  sortOrder?: number;
  active?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
}

/**
 * Un anuncio se publica solo si está encendido y hoy cae dentro de su ventana.
 * Las fechas vacías significan "sin límite", no "nunca": un anuncio sin fechas
 * se muestra siempre.
 */
const publishable = (): Prisma.AdvertisementWhereInput => {
  const now = new Date();
  return {
    active: true,
    AND: [
      { OR: [{ startDate: null }, { startDate: { lte: now } }] },
      { OR: [{ endDate: null }, { endDate: { gte: now } }] },
    ],
  };
};

export const adsService = {
  /** Lo que ve el visitante en una ranura concreta del sitio. */
  listPublic: (placement?: string) =>
    prisma.advertisement.findMany({
      where: {
        ...publishable(),
        ...(placement ? { placements: { has: placement as AdPlacement } } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    }),

  /** Lo que ve el administrador: todo, incluido lo apagado, lo programado y lo vencido. */
  listAll: () =>
    prisma.advertisement.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] }),

  create: (data: AdInput) => prisma.advertisement.create({ data }),

  update: (id: string, data: Partial<AdInput>) =>
    prisma.advertisement.update({ where: { id }, data }),

  remove: (id: string) => prisma.advertisement.delete({ where: { id } }),
};
