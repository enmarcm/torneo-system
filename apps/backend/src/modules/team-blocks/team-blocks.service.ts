import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { TeamBlockScope } from '@prisma/client';

const blockInclude = {
  team: { select: { id: true, name: true, logoUrl: true, status: true } },
  competition: { select: { id: true, name: true } },
  blockedBy: { select: { id: true, email: true } },
  liftedBy: { select: { id: true, email: true } },
};

export const teamBlocksService = {
  /**
   * Historial completo de bloqueos. No se borra nada al levantar un bloqueo:
   * queda el motivo, quién lo puso y quién lo levantó.
   */
  list: (filters: { teamId?: string; competitionId?: string; active?: boolean }) =>
    prisma.teamBlock.findMany({
      where: {
        ...(filters.teamId ? { teamId: filters.teamId } : {}),
        ...(filters.competitionId ? { competitionId: filters.competitionId } : {}),
        ...(filters.active !== undefined ? { active: filters.active } : {}),
      },
      include: blockInclude,
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    }),

  /**
   * Bloquea un club entero (no puede iniciar sesión ni jugar nada) o solo una
   * competición, porque un mismo club puede tener equipos en varias categorías
   * a la vez y una sanción no tiene por qué arrastrarlas todas.
   */
  create: async (
    data: {
      teamId: string;
      scope: TeamBlockScope;
      competitionId?: string | null;
      reason: string;
    },
    actorId?: string,
  ) => {
    const team = await prisma.team.findUnique({ where: { id: data.teamId } });
    if (!team) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

    if (data.scope === 'COMPETITION' && !data.competitionId) {
      throw new AppError(422, 'Indicá la competición a bloquear', 'NEED_COMPETITION');
    }

    const duplicate = await prisma.teamBlock.findFirst({
      where: {
        teamId: data.teamId,
        scope: data.scope,
        active: true,
        competitionId: data.scope === 'COMPETITION' ? data.competitionId : null,
      },
    });
    if (duplicate) throw new AppError(409, MESSAGES.alreadyBlocked, 'DUPLICATE_BLOCK');

    const block = await prisma.teamBlock.create({
      data: {
        teamId: data.teamId,
        scope: data.scope,
        competitionId: data.scope === 'COMPETITION' ? data.competitionId : null,
        reason: data.reason,
        blockedById: actorId ?? null,
      },
      include: blockInclude,
    });

    // El bloqueo total desactiva el club; el de competición solo esa inscripción.
    // En ningún caso se borra nada: el historial queda intacto para reincorporarlo.
    if (data.scope === 'CLUB') {
      await prisma.team.update({ where: { id: data.teamId }, data: { status: 'INACTIVE' } });
    } else if (data.competitionId) {
      await prisma.teamRegistration.updateMany({
        where: { teamId: data.teamId, competitionId: data.competitionId },
        data: { status: 'INACTIVE' },
      });
    }

    return block;
  },

  /** Levanta el bloqueo y reactiva al equipo, conservando el registro. */
  lift: async (id: string, liftReason: string | undefined, actorId?: string) => {
    const block = await prisma.teamBlock.findUnique({ where: { id } });
    if (!block) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    if (!block.active) throw new AppError(409, 'Ese bloqueo ya fue levantado', 'ALREADY_LIFTED');

    const updated = await prisma.teamBlock.update({
      where: { id },
      data: {
        active: false,
        liftedAt: new Date(),
        liftedById: actorId ?? null,
        liftReason: liftReason ?? null,
      },
      include: blockInclude,
    });

    if (block.scope === 'CLUB') {
      // Solo se reactiva si no le queda otro bloqueo total encima.
      const otros = await prisma.teamBlock.count({
        where: { teamId: block.teamId, scope: 'CLUB', active: true },
      });
      if (otros === 0) {
        await prisma.team.update({ where: { id: block.teamId }, data: { status: 'ACTIVE' } });
      }
    } else if (block.competitionId) {
      const otros = await prisma.teamBlock.count({
        where: {
          teamId: block.teamId,
          competitionId: block.competitionId,
          scope: 'COMPETITION',
          active: true,
        },
      });
      if (otros === 0) {
        await prisma.teamRegistration.updateMany({
          where: { teamId: block.teamId, competitionId: block.competitionId },
          data: { status: 'ACTIVE' },
        });
      }
    }

    return updated;
  },

  /** Bloqueos activos de un club, separados por alcance. */
  forTeam: async (teamId: string) => {
    const active = await prisma.teamBlock.findMany({
      where: { teamId, active: true },
      include: blockInclude,
    });
    return {
      club: active.find((b) => b.scope === 'CLUB') ?? null,
      competitions: active.filter((b) => b.scope === 'COMPETITION'),
    };
  },

  /** Usado en el login: un club bloqueado o desactivado no puede entrar. */
  clubBlock: (teamId: string) =>
    prisma.teamBlock.findFirst({
      where: { teamId, scope: 'CLUB', active: true },
      orderBy: { createdAt: 'desc' },
    }),
};
