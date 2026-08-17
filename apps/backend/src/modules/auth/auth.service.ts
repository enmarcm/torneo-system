import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { env } from '@/config/env';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { verifyPassword } from '@/utils/password.util';
import { teamBlocksService } from '@/modules/team-blocks/team-blocks.service';

type SignUser = { id: string; role: string; teamId: string | null };

const sign = (user: SignUser) => ({
  accessToken: jwt.sign(
    { id: user.id, role: user.role, teamId: user.teamId },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES } as SignOptions,
  ),
  refreshToken: jwt.sign(
    { id: user.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES } as SignOptions,
  ),
});

const publicUser = (u: { id: string; email: string; role: string; teamId: string | null }) => ({
  id: u.id,
  email: u.email,
  role: u.role,
  teamId: u.teamId,
});

export const authService = {
  login: async (email: string, password: string) => {
    const user = await prisma.user.findUnique({ where: { email }, include: { team: true } });
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError(401, MESSAGES.badCredentials, 'BAD_CREDENTIALS');
    }
    if (!(await verifyPassword(user.passwordHash, password))) {
      throw new AppError(401, MESSAGES.badCredentials, 'BAD_CREDENTIALS');
    }
    // Se valida después de la contraseña para no revelar el estado del equipo
    // a quien no conoce las credenciales.
    if (user.team) {
      const block = await teamBlocksService.clubBlock(user.team.id);
      if (block) throw new AppError(403, MESSAGES.teamBlocked, 'TEAM_BLOCKED');
      if (user.team.status !== 'ACTIVE') {
        throw new AppError(403, MESSAGES.teamInactive, 'TEAM_INACTIVE');
      }
    }
    return { user: publicUser(user), ...sign(user) };
  },

  refresh: async (token?: string) => {
    if (!token) throw new AppError(401, 'Sin refresh token', 'NO_REFRESH');
    let userId: string;
    try {
      ({ id: userId } = jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string });
    } catch {
      throw new AppError(401, 'Refresh inválido', 'BAD_REFRESH');
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { team: true },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError(401, 'Refresh inválido', 'BAD_REFRESH');
    }
    // Si al equipo lo bloquearon con la sesión abierta, no se le renueva el token.
    if (user.team) {
      const block = await teamBlocksService.clubBlock(user.team.id);
      if (block) throw new AppError(403, MESSAGES.teamBlocked, 'TEAM_BLOCKED');
      if (user.team.status !== 'ACTIVE') {
        throw new AppError(403, MESSAGES.teamInactive, 'TEAM_INACTIVE');
      }
    }
    return { user: publicUser(user), ...sign(user) };
  },

  me: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, teamId: true },
    }),
};
