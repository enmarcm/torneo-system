import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/utils/password.util';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { purgeUser, CASCADE_TX } from '@/utils/cascade.util';

export const usersService = {
  list: () =>
    prisma.user.findMany({
      where: { role: 'TEAM_LEADER' },
      select: { id: true, username: true, email: true, status: true, teamId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),

  create: async (data: { username: string; password: string; teamId?: string }) => {
    const exists = await prisma.user.findUnique({ where: { username: data.username } });
    if (exists) throw new AppError(409, 'Ya existe un usuario con ese nombre', 'DUPLICATE');
    const passwordHash = await hashPassword(data.password);
    return prisma.user.create({
      data: {
        username: data.username,
        passwordHash,
        role: 'TEAM_LEADER',
        teamId: data.teamId ?? null,
      },
      select: { id: true, username: true, email: true, status: true, teamId: true },
    });
  },

  setStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') =>
    prisma.user.update({ where: { id }, data: { status }, select: { id: true, status: true } }),

  /** Borrado definitivo: la auditoría y las sanciones que firmó quedan sin autor. */
  remove: async (id: string) => {
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return prisma.$transaction(
      async (tx) => {
        await purgeUser(tx, id);
        return { id };
      },
      CASCADE_TX,
    );
  },
};
