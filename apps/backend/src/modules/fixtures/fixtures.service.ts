import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { Prisma } from '@prisma/client';
import { emitMatchListChanged } from '@/lib/socket';

const BYE = '__BYE__';
const LETTERS = 'ABCDEFGHIJKLMNOP';

const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Todos contra todos por el método del círculo. Devuelve las jornadas ya
 * emparejadas y en orden aleatorio; la localía se alterna jornada a jornada para
 * que ningún equipo juegue de local muchas veces seguidas.
 */
const roundRobin = (ids: string[]): Array<Array<{ home: string; away: string }>> => {
  const list = shuffle(ids);
  if (list.length % 2 === 1) list.push(BYE);

  const n = list.length;
  const half = n / 2;
  const fixed = list[0];
  let rest = list.slice(1);
  const days: Array<Array<{ home: string; away: string }>> = [];

  for (let r = 0; r < n - 1; r++) {
    const arrangement = [fixed, ...rest];
    const day: Array<{ home: string; away: string }> = [];
    for (let i = 0; i < half; i++) {
      const a = arrangement[i];
      const b = arrangement[n - 1 - i];
      if (a === BYE || b === BYE) continue;
      day.push(r % 2 === 0 ? { home: a, away: b } : { home: b, away: a });
    }
    if (day.length > 0) days.push(day);
    rest = [rest[rest.length - 1], ...rest.slice(0, -1)];
  }
  return days;
};

const activeRegistrations = async (competitionId: string) =>
  prisma.teamRegistration.findMany({
    where: { competitionId, status: 'ACTIVE' },
    select: { id: true },
  });

/** Impide re-sortear encima de partidos que ya tienen resultado o están en juego. */
const assertNoPlayedMatches = async (
  competitionId: string,
  stages: Array<'LEAGUE' | 'GROUP'>,
) => {
  const played = await prisma.match.count({
    where: {
      competitionId,
      stage: { in: stages },
      status: { in: ['LIVE', 'FINISHED'] },
    },
  });
  if (played > 0) throw new AppError(409, MESSAGES.fixtureExists, 'FIXTURE_EXISTS');
};

export const fixturesService = {
  /**
   * Sorteo de liga: genera los cruces del todos contra todos sin fecha. El
   * admin asigna después día y hora partido por partido.
   *
   * Respeta lo que ya está decidido. Un partido con día y hora —creado a mano
   * o programado a partir de un sorteo anterior— no se toca y su cruce no se
   * vuelve a generar; antes el sorteo borraba todos los partidos programados y
   * los rehacía, así que se llevaba puesto el que el admin acababa de cargar
   * con su fecha, su sede y su marca de destacado. Lo que sí se rehace es lo
   * que quedó sin programar, que es justamente el sobrante del sorteo previo.
   */
  generateLeague: async (competitionId: string) => {
    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

    const regs = await activeRegistrations(competitionId);
    if (regs.length < 2) throw new AppError(422, MESSAGES.fixtureNeedsTeams, 'NEED_TEAMS');

    await assertNoPlayedMatches(competitionId, ['LEAGUE']);

    /*
      Cruces ya comprometidos. A dos rondas la vuelta es un partido distinto de
      la ida, así que la pareja se compara con dirección; a una sola ronda el
      cruce es el mismo se juegue de local o de visitante.
    */
    const pairKey = (a: string, b: string) =>
      competition.rounds > 1 ? `${a}>${b}` : [a, b].sort().join('|');

    const kept = await prisma.match.findMany({
      where: { competitionId, stage: 'LEAGUE', scheduledAt: { not: null } },
      select: { homeRegistrationId: true, awayRegistrationId: true },
    });
    const taken = new Set(
      kept.map((m) => pairKey(m.homeRegistrationId, m.awayRegistrationId)),
    );

    const firstLeg = roundRobin(regs.map((r) => r.id));
    const days = [...firstLeg];
    // Segunda vuelta: mismos cruces con la localía invertida.
    if (competition.rounds > 1) {
      for (const day of firstLeg) {
        days.push(day.map((m) => ({ home: m.away, away: m.home })));
      }
    }

    const data: Prisma.MatchCreateManyInput[] = [];
    days.forEach((day, idx) => {
      for (const pair of day) {
        // Ese cruce ya existe con fecha: se deja como está y no se duplica.
        if (taken.has(pairKey(pair.home, pair.away))) continue;
        data.push({
          competitionId,
          stage: 'LEAGUE',
          matchday: idx + 1,
          homeRegistrationId: pair.home,
          awayRegistrationId: pair.away,
          scheduledAt: null,
        });
      }
    });

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      /*
        Solo el sobrante del sorteo anterior: sin día ni hora nadie lo dio por
        decidido. Sin el filtro por `scheduledAt`, esto borraba también los
        partidos que el admin ya había programado.
      */
      await tx.match.deleteMany({
        where: { competitionId, stage: 'LEAGUE', status: 'SCHEDULED', scheduledAt: null },
      });
      await tx.match.createMany({ data });
      emitMatchListChanged();
      return { matchdays: days.length, matches: data.length, kept: kept.length };
    });
  },

  /**
   * Sorteo de fase de grupos: reparte los equipos al azar en los grupos
   * configurados y genera el todos contra todos dentro de cada grupo.
   */
  generateGroupStage: async (competitionId: string) => {
    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

    const regs = await activeRegistrations(competitionId);
    if (regs.length < 2) throw new AppError(422, MESSAGES.fixtureNeedsTeams, 'NEED_TEAMS');

    await assertNoPlayedMatches(competitionId, ['GROUP']);

    const groupSize = competition.groupSize ?? 4;
    const numGroups = competition.numGroups ?? Math.ceil(regs.length / groupSize);
    const drawn = shuffle(regs.map((r) => r.id));

    // Reparto serpenteado simple: se van soltando de a uno por grupo.
    const buckets: string[][] = Array.from({ length: numGroups }, () => []);
    drawn.forEach((id, i) => buckets[i % numGroups].push(id));

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.match.deleteMany({
        where: { competitionId, stage: 'GROUP', status: 'SCHEDULED' },
      });
      await tx.teamRegistration.updateMany({
        where: { competitionId },
        data: { groupId: null },
      });
      await tx.competitionGroup.deleteMany({ where: { competitionId } });

      let created = 0;
      for (let g = 0; g < numGroups; g++) {
        const members = buckets[g];
        if (members.length === 0) continue;
        const group = await tx.competitionGroup.create({
          data: { competitionId, name: `Grupo ${LETTERS[g]}` },
        });
        await tx.teamRegistration.updateMany({
          where: { id: { in: members } },
          data: { groupId: group.id },
        });

        const days = roundRobin(members);
        const data: Prisma.MatchCreateManyInput[] = [];
        days.forEach((day, idx) => {
          for (const pair of day) {
            data.push({
              competitionId,
              groupId: group.id,
              stage: 'GROUP',
              matchday: idx + 1,
              homeRegistrationId: pair.home,
              awayRegistrationId: pair.away,
              scheduledAt: null,
            });
          }
        });
        if (data.length > 0) {
          await tx.match.createMany({ data });
          created += data.length;
        }
      }
      emitMatchListChanged();
      return { groups: numGroups, matches: created };
    });
  },

  /** Borra los partidos aún no jugados de una fase, para volver a sortear. */
  clear: async (competitionId: string, stage: 'LEAGUE' | 'GROUP') => {
    const res = await prisma.match.deleteMany({
      where: { competitionId, stage, status: 'SCHEDULED' },
    });
    emitMatchListChanged();
    return { deleted: res.count };
  },

  /** Asigna día, hora y sede a un partido ya sorteado. */
  schedule: async (
    matchId: string,
    scheduledAt: Date | null,
    venue?: string | null,
    featured?: boolean,
  ) => {
    const m = await prisma.match.update({
      where: { id: matchId },
      data: {
        scheduledAt,
        ...(venue !== undefined ? { venue } : {}),
        ...(featured !== undefined ? { featured } : {}),
      },
    });
    // Ponerle fecha lo mueve de "sin programar" a la jornada que le toque.
    emitMatchListChanged();
    return m;
  },

  /** Asignación masiva: varios partidos con su fecha en una sola llamada. */
  scheduleBulk: async (items: Array<{ matchId: string; scheduledAt: string; venue?: string }>) =>
    prisma.$transaction(
      items.map((i) =>
        prisma.match.update({
          where: { id: i.matchId },
          data: {
            scheduledAt: new Date(i.scheduledAt),
            ...(i.venue !== undefined ? { venue: i.venue } : {}),
          },
        }),
      ),
    ).then((res) => {
      emitMatchListChanged();
      return res;
    }),
};
