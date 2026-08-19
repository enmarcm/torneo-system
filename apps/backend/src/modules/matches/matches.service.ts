import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { emitMatchUpdate } from '@/lib/socket';
import { Prisma } from '@prisma/client';
import type { CreateMatchDto } from './matches.schema';

const teamInclude = { team: true };

/**
 * Datos de la competición que viajan con cada partido. La pantalla pública
 * mezcla partidos de varias competiciones en un mismo día, así que necesita
 * saber de cuál viene cada uno (división, copa, juvenil…) sin pedirlo aparte.
 */
const competitionInclude = {
  select: {
    id: true,
    name: true,
    kind: true,
    format: true,
    division: true,
    divisionLevel: true,
    editionId: true,
    category: { select: { id: true, name: true } },
  },
} as const;

export interface MatchListFilters {
  competitionId?: string;
  status?: string;
  /** Acota a todas las competiciones de una edición. */
  editionId?: string;
  page?: number;
  limit?: number;
  /**
   * `desc` para lo que ya pasó: la última jornada se lee de lo más reciente
   * hacia atrás, al revés que el calendario.
   */
  order?: 'asc' | 'desc';
  /**
   * Deja solo los partidos con fecha de hoy en adelante. Sin esto, un partido
   * programado que nunca se cerró sigue apareciendo entre "los que vienen".
   */
  upcoming?: boolean;
}

const matchWhere = ({ competitionId, status, editionId, upcoming }: MatchListFilters) => ({
  ...(competitionId ? { competitionId } : {}),
  ...(editionId ? { competition: { editionId } } : {}),
  ...(status ? { status: status as 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' } : {}),
  ...(upcoming ? { scheduledAt: { gte: new Date() } } : {}),
});

export const matchesService = {
  list: (filters: MatchListFilters = {}) => {
    const { page = 1, limit = 50 } = filters;
    return prisma.match.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: matchWhere(filters),
      include: {
        homeRegistration: { include: teamInclude },
        awayRegistration: { include: teamInclude },
        competition: competitionInclude,
        mvpPlayer: true,
      },
      // Postgres deja los NULL al final, así los partidos sin día asignado
      // quedan después de los ya programados.
      orderBy: { scheduledAt: filters.order === 'desc' ? 'desc' : 'asc' },
    });
  },
  count: (filters: MatchListFilters = {}) => prisma.match.count({ where: matchWhere(filters) }),

  get: async (id: string) => {
    const m = await prisma.match.findUnique({
      where: { id },
      include: {
        homeRegistration: { include: teamInclude },
        awayRegistration: { include: teamInclude },
        events: { include: { player: true }, orderBy: { minute: 'desc' } },
        mvpPlayer: true,
        tie: true,
      },
    });
    if (!m) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return m;
  },

  create: (data: CreateMatchDto) => prisma.match.create({ data }),

  update: async (id: string, data: Partial<CreateMatchDto>) => {
    const m = await prisma.match.update({ where: { id }, data });
    emitMatchUpdate({
      matchId: id,
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
    });
    return m;
  },

  start: async (id: string) => {
    const m = await prisma.match.update({ where: { id }, data: { status: 'LIVE' } });
    emitMatchUpdate({ matchId: id, status: 'LIVE', homeScore: m.homeScore, awayScore: m.awayScore });
    return m;
  },

  finish: async (id: string) =>
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const match = await tx.match.findUnique({ where: { id }, include: { events: true } });
      if (!match) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
      await tx.match.update({ where: { id }, data: { status: 'FINISHED' } });

      const goals: Record<string, number> = {};
      const yellows: Record<string, number> = {};
      const reds: Record<string, number> = {};
      for (const ev of match.events) {
        if (!ev.playerId) continue;
        if (ev.type === 'GOAL') goals[ev.playerId] = (goals[ev.playerId] || 0) + 1;
        if (ev.type === 'YELLOW') yellows[ev.playerId] = (yellows[ev.playerId] || 0) + 1;
        if (ev.type === 'RED') reds[ev.playerId] = (reds[ev.playerId] || 0) + 1;
      }
      const regs = [match.homeRegistrationId, match.awayRegistrationId];
      const roster = await tx.rosterEntry.findMany({
        where: { teamRegistrationId: { in: regs }, status: 'ACTIVE' },
      });
      for (const re of roster) {
        const g = goals[re.playerId] || 0;
        const y = yellows[re.playerId] || 0;
        const r = reds[re.playerId] || 0;
        await tx.playerSeasonStats.upsert({
          where: { rosterEntryId: re.id },
          update: {
            matchesPlayed: { increment: 1 },
            goals: { increment: g },
            yellowCards: { increment: y },
            redCards: { increment: r },
          },
          create: {
            rosterEntryId: re.id,
            matchesPlayed: 1,
            goals: g,
            yellowCards: y,
            redCards: r,
          },
        });
      }
      emitMatchUpdate({
        matchId: id,
        status: 'FINISHED',
        homeScore: match.homeScore,
        awayScore: match.awayScore,
      });
      return tx.match.findUnique({ where: { id } });
    }),

  /**
   * Designa el MVP de un partido ya finalizado y guarda su foto.
   * La imagen va al bucket público, así cualquiera puede descargarla desde el
   * portal sin iniciar sesión.
   */
  setMvp: async (
    id: string,
    data: { playerId: string; photoUrl?: string | null; note?: string | null },
  ) => {
    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    if (match.status !== 'FINISHED') {
      throw new AppError(422, MESSAGES.matchNotFinished, 'NOT_FINISHED');
    }

    const inRoster = await prisma.rosterEntry.findFirst({
      where: {
        playerId: data.playerId,
        teamRegistrationId: { in: [match.homeRegistrationId, match.awayRegistrationId] },
      },
    });
    if (!inRoster) throw new AppError(422, MESSAGES.mvpNotInMatch, 'MVP_NOT_IN_MATCH');

    return prisma.match.update({
      where: { id },
      data: {
        mvpPlayerId: data.playerId,
        mvpPhotoUrl: data.photoUrl ?? null,
        mvpNote: data.note ?? null,
      },
      include: { mvpPlayer: true },
    });
  },

  clearMvp: (id: string) =>
    prisma.match.update({
      where: { id },
      data: { mvpPlayerId: null, mvpPhotoUrl: null, mvpNote: null },
    }),

  /** Borrado definitivo: los goles y tarjetas del partido se van con él. */
  remove: (id: string) =>
    prisma.$transaction(async (tx) => {
      await tx.matchEvent.deleteMany({ where: { matchId: id } });
      await tx.match.delete({ where: { id } });
      return { id };
    }),
};
