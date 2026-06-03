import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';

export const transfersService = {
  list: (editionId?: string) =>
    prisma.transfer.findMany({
      where: editionId ? { editionId } : {},
      include: {
        player: true,
        fromRegistration: { include: { team: true } },
        toRegistration: { include: { team: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),

  create: async (data: {
    playerId: string;
    editionId: string;
    fromRegistrationId?: string;
    toRegistrationId: string;
  }) => {
    const edition = await prisma.edition.findUnique({ where: { id: data.editionId } });
    if (!edition) throw new AppError(404, 'Edición no encontrada', 'NOT_FOUND');
    const now = new Date();
    const inWindow =
      edition.transfersOpen &&
      (!edition.transferWindowStart || now >= edition.transferWindowStart) &&
      (!edition.transferWindowEnd || now <= edition.transferWindowEnd);
    if (!inWindow) throw new AppError(422, MESSAGES.transfersClosed, 'TRANSFERS_CLOSED');
    return prisma.transfer.create({ data: { ...data, status: 'PENDING' } });
  },

  setStatus: async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const transfer = await prisma.transfer.update({ where: { id }, data: { status } });
    if (status === 'APPROVED') {
      if (transfer.fromRegistrationId) {
        await prisma.rosterEntry.updateMany({
          where: {
            playerId: transfer.playerId,
            teamRegistrationId: transfer.fromRegistrationId,
          },
          data: { status: 'INACTIVE' },
        });
      }
      await prisma.rosterEntry.upsert({
        where: {
          playerId_teamRegistrationId: {
            playerId: transfer.playerId,
            teamRegistrationId: transfer.toRegistrationId,
          },
        },
        update: { status: 'ACTIVE' },
        create: {
          playerId: transfer.playerId,
          teamRegistrationId: transfer.toRegistrationId,
          stats: { create: {} },
        },
      });
    }
    return transfer;
  },
};
