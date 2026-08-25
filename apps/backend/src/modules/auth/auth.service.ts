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

const publicUser = (u: {
  id: string;
  username: string;
  email: string | null;
  role: string;
  teamId: string | null;
}) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  role: u.role,
  teamId: u.teamId,
});

export const authService = {
  /**
   * `identifier` es el nombre de usuario. También se acepta el correo para no
   * dejar afuera a quien ya lo tenía cargado y lo escribe por costumbre; el
   * correo no es obligatorio, así que no puede ser la única vía de entrada.
   */
  login: async (identifier: string, password: string) => {
    const value = identifier.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { OR: [{ username: value }, { email: value }] },
      include: { team: true },
    });
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
      select: { id: true, username: true, email: true, role: true, teamId: true },
    }),

  /**
   * El propio usuario carga o cambia su correo. Es el paso que reemplaza al
   * correo que antes escribía el administrador al crear el equipo.
   */
  updateMe: async (id: string, email: string | null) => {
    const value = email ? email.trim().toLowerCase() : null;
    if (value) {
      const taken = await prisma.user.findFirst({
        where: { email: value, NOT: { id } },
        select: { id: true },
      });
      if (taken) throw new AppError(409, 'Ese correo ya está en uso', 'DUPLICATE');
    }
    return prisma.user.update({
      where: { id },
      data: { email: value },
      select: { id: true, username: true, email: true, role: true, teamId: true },
    });
  },
};
