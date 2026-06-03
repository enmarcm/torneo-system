import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/utils/password.util';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';

export const usersService = {
  list: () =>
    prisma.user.findMany({
      where: { role: 'TEAM_LEADER' },
      select: { id: true, email: true, status: true, teamId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),

  create: async (data: { email: string; password: string; teamId?: string }) => {
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new AppError(409, 'Ya existe un usuario con ese correo', 'DUPLICATE');
    const passwordHash = await hashPassword(data.password);
    return prisma.user.create({
      data: { email: data.email, passwordHash, role: 'TEAM_LEADER', teamId: data.teamId ?? null },
      select: { id: true, email: true, status: true, teamId: true },
    });
  },

  setStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') =>
    prisma.user.update({ where: { id }, data: { status }, select: { id: true, status: true } }),

  remove: async (id: string) => {
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    await prisma.user.delete({ where: { id } });
    return { id };
  },
};
