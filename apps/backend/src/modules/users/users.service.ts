import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/utils/password.util';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { purgeUser, CASCADE_TX } from '@/utils/cascade.util';
import type { UserRole } from '@/config/roles';

const SELECT = {
  id: true,
  username: true,
  email: true,
  role: true,
  status: true,
  teamId: true,
  team: { select: { id: true, name: true, logoUrl: true } },
  createdAt: true,
} as const;

/**
 * Quedarse sin ningún administrador activo deja el sistema sin quién administre
 * usuarios: no hay forma de volver a entrar salvo tocando la base a mano.
 */
const assertNotLastAdmin = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== 'ADMIN' || user.status !== 'ACTIVE') return;
  const others = await prisma.user.count({
    where: { role: 'ADMIN', status: 'ACTIVE', NOT: { id: userId } },
  });
  if (others === 0) {
    throw new AppError(
      409,
      'Es el único administrador activo. Creá o activá otro antes de cambiar este.',
      'LAST_ADMIN',
    );
  }
};

const assertNotSelf = (actorId: string, targetId: string, action: string) => {
  if (actorId === targetId) {
    throw new AppError(409, `No podés ${action} tu propia cuenta`, 'SELF_ACTION');
  }
};

const assertUsernameFree = async (username: string, exceptId?: string) => {
  const taken = await prisma.user.findFirst({
    where: { username, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
    select: { id: true },
  });
  if (taken) throw new AppError(409, 'Ya existe un usuario con ese nombre', 'DUPLICATE');
};

const assertEmailFree = async (email: string, exceptId?: string) => {
  const taken = await prisma.user.findFirst({
    where: { email, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
    select: { id: true },
  });
  if (taken) throw new AppError(409, 'Ese correo ya está en uso', 'DUPLICATE');
};

/** El club queda asociado solo al delegado; el staff no cuelga de un equipo. */
const assertTeamFree = async (teamId: string, exceptId?: string) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, name: true, leader: { select: { id: true } } },
  });
  if (!team) throw new AppError(404, 'El equipo indicado no existe', 'NOT_FOUND');
  if (team.leader && team.leader.id !== exceptId) {
    throw new AppError(409, `"${team.name}" ya tiene un delegado asignado`, 'DUPLICATE');
  }
};

const normalizeEmail = (email?: string | null) => (email ? email.trim().toLowerCase() : null);

export const usersService = {
  list: ({ role, q }: { role?: UserRole; q?: string } = {}) =>
    prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(q
          ? {
              OR: [
                { username: { contains: q, mode: 'insensitive' as const } },
                { email: { contains: q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      select: SELECT,
      orderBy: [{ role: 'asc' }, { username: 'asc' }],
    }),

  get: async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id }, select: SELECT });
    if (!user) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return user;
  },

  create: async (data: {
    username: string;
    password: string;
    email?: string | null;
    role: UserRole;
    teamId?: string | null;
  }) => {
    await assertUsernameFree(data.username);
    const email = normalizeEmail(data.email);
    if (email) await assertEmailFree(email);
    const teamId = data.role === 'TEAM_LEADER' ? (data.teamId ?? null) : null;
    if (teamId) await assertTeamFree(teamId);

    return prisma.user.create({
      data: {
        username: data.username,
        email,
        passwordHash: await hashPassword(data.password),
        role: data.role,
        teamId,
      },
      select: SELECT,
    });
  },

  update: async (
    actorId: string,
    id: string,
    data: { username?: string; email?: string | null; role?: UserRole; teamId?: string | null },
  ) => {
    const current = await prisma.user.findUnique({ where: { id } });
    if (!current) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

    if (data.role && data.role !== current.role) {
      assertNotSelf(actorId, id, 'cambiarle el rol a');
      await assertNotLastAdmin(id);
    }
    if (data.username && data.username !== current.username) {
      await assertUsernameFree(data.username, id);
    }
    const email = data.email === undefined ? undefined : normalizeEmail(data.email);
    if (email) await assertEmailFree(email, id);

    const role = data.role ?? current.role;
    /*
      Al dejar de ser delegado se suelta el club: si el vínculo quedara, el
      equipo seguiría "con delegado" y nadie más podría tomarlo.
    */
    let teamId = data.teamId === undefined ? current.teamId : data.teamId;
    if (role !== 'TEAM_LEADER') teamId = null;
    if (teamId && teamId !== current.teamId) await assertTeamFree(teamId, id);

    return prisma.user.update({
      where: { id },
      data: {
        ...(data.username ? { username: data.username } : {}),
        ...(email === undefined ? {} : { email }),
        role,
        teamId,
      },
      select: SELECT,
    });
  },

  /** El administrador le pone una contraseña nueva a cualquier cuenta. */
  setPassword: async (id: string, password: string) => {
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    await prisma.user.update({
      where: { id },
      data: { passwordHash: await hashPassword(password) },
    });
    return { id };
  },

  setStatus: async (actorId: string, id: string, status: 'ACTIVE' | 'INACTIVE') => {
    if (status === 'INACTIVE') {
      assertNotSelf(actorId, id, 'desactivar');
      await assertNotLastAdmin(id);
    }
    return prisma.user.update({ where: { id }, data: { status }, select: SELECT });
  },

  /** Borrado definitivo: la auditoría y las sanciones que firmó quedan sin autor. */
  remove: async (actorId: string, id: string) => {
    assertNotSelf(actorId, id, 'eliminar');
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    await assertNotLastAdmin(id);
    return prisma.$transaction(
      async (tx) => {
        await purgeUser(tx, id);
        return { id };
      },
      CASCADE_TX,
    );
  },
};
