import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { standingsService } from '@/modules/standings/standings.service';
import { MatchStage, Prisma } from '@prisma/client';

/** Ronda que corresponde según cuántos equipos siguen vivos. */
const STAGE_BY_SIZE: Record<number, MatchStage> = {
  16: MatchStage.R16,
  8: MatchStage.QUARTER,
  4: MatchStage.SEMI,
  2: MatchStage.FINAL,
};

const isPowerOfTwo = (n: number) => n >= 2 && (n & (n - 1)) === 0;

const tieInclude = {
  homeRegistration: { include: { team: true } },
  awayRegistration: { include: { team: true } },
  winnerRegistration: { include: { team: true } },
  matches: { orderBy: { leg: 'asc' } },
} satisfies Prisma.KnockoutTieInclude;

export const knockoutService = {
  /**
   * Construye el cuadro vacío a partir de la cantidad de clasificados.
   * Cada llave apunta a la siguiente, así el ganador avanza solo.
   * Las rondas marcadas en `twoLeggedStages` quedan a ida y vuelta.
   */
  generate: async (competitionId: string) => {
    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

    const size = competition.knockoutQualifiers ?? 0;
    if (!isPowerOfTwo(size) || size > 16) {
      throw new AppError(422, MESSAGES.bracketNeedsTeams, 'BAD_BRACKET_SIZE');
    }

    const played = await prisma.match.count({
      where: {
        competitionId,
        stage: { notIn: [MatchStage.LEAGUE, MatchStage.GROUP] },
        status: { in: ['LIVE', 'FINISHED'] },
      },
    });
    if (played > 0) throw new AppError(409, MESSAGES.fixtureExists, 'FIXTURE_EXISTS');

    const twoLegged = new Set(competition.twoLeggedStages);

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.knockoutTie.deleteMany({ where: { competitionId } });

      // Se crea desde la final hacia atrás para poder enlazar `nextTie`.
      let nextRound: string[] = [];
      for (let alive = 2; alive <= size; alive *= 2) {
        const stage = STAGE_BY_SIZE[alive];
        const count = alive / 2;
        const created: string[] = [];
        for (let slot = 0; slot < count; slot++) {
          const tie = await tx.knockoutTie.create({
            data: {
              competitionId,
              stage,
              slot,
              twoLegged: twoLegged.has(stage),
              nextTieId: nextRound.length > 0 ? nextRound[Math.floor(slot / 2)] : null,
              nextSlotIsHome: slot % 2 === 0,
            },
          });
          created.push(tie.id);
        }
        nextRound = created;
      }

      return tx.knockoutTie.findMany({
        where: { competitionId },
        orderBy: [{ stage: 'asc' }, { slot: 'asc' }],
        include: tieInclude,
      });
    });
  },

  /**
   * Siembra la primera ronda con los clasificados de cada grupo, cruzando
   * primero de un grupo contra segundo del grupo vecino (1A-2B, 1B-2A…).
   */
  seedFromGroups: async (competitionId: string) => {
    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

    const groups = await prisma.competitionGroup.findMany({
      where: { competitionId },
      orderBy: { name: 'asc' },
    });
    if (groups.length === 0) {
      throw new AppError(422, 'La competición no tiene grupos generados', 'NO_GROUPS');
    }

    const perGroup = competition.qualifiersPerGroup ?? 2;
    const qualified: string[][] = [];
    for (const g of groups) {
      const table = await standingsService.byCompetition(competitionId, g.id);
      qualified.push(table.slice(0, perGroup).map((r) => r.registrationId));
    }

    const firstStage = STAGE_BY_SIZE[groups.length * perGroup];
    if (!firstStage) throw new AppError(422, MESSAGES.bracketNeedsTeams, 'BAD_BRACKET_SIZE');

    const ties = await prisma.knockoutTie.findMany({
      where: { competitionId, stage: firstStage },
      orderBy: { slot: 'asc' },
    });
    if (ties.length === 0) {
      throw new AppError(422, 'Generá primero el cuadro de eliminatoria', 'NO_BRACKET');
    }

    // Emparejamiento cruzado: el ganador del grupo i contra el segundo del grupo vecino.
    const pairs: Array<{ home: string; away: string }> = [];
    for (let i = 0; i < groups.length; i++) {
      const partner = i % 2 === 0 ? i + 1 : i - 1;
      const home = qualified[i]?.[0];
      const away = qualified[partner]?.[1];
      if (home && away) pairs.push({ home, away });
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (let i = 0; i < ties.length && i < pairs.length; i++) {
        await tx.knockoutTie.update({
          where: { id: ties[i].id },
          data: {
            homeRegistrationId: pairs[i].home,
            awayRegistrationId: pairs[i].away,
            winnerRegistrationId: null,
          },
        });
      }
      return tx.knockoutTie.findMany({
        where: { competitionId },
        orderBy: [{ stage: 'asc' }, { slot: 'asc' }],
        include: tieInclude,
      });
    });
  },

  /** Fija a mano los dos equipos de una llave (para cuadros sin fase de grupos). */
  setTeams: async (tieId: string, homeRegistrationId: string, awayRegistrationId: string) =>
    prisma.knockoutTie.update({
      where: { id: tieId },
      data: { homeRegistrationId, awayRegistrationId, winnerRegistrationId: null },
      include: tieInclude,
    }),

  /**
   * Crea los partidos de una llave: uno solo, o ida y vuelta con la localía
   * invertida en el segundo partido.
   */
  createMatches: async (tieId: string) => {
    const tie = await prisma.knockoutTie.findUnique({
      where: { id: tieId },
      include: { matches: true },
    });
    if (!tie) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    if (!tie.homeRegistrationId || !tie.awayRegistrationId) {
      throw new AppError(422, 'La llave todavía no tiene los dos equipos definidos', 'TIE_INCOMPLETE');
    }
    if (tie.matches.some((m) => m.status === 'LIVE' || m.status === 'FINISHED')) {
      throw new AppError(409, MESSAGES.fixtureExists, 'FIXTURE_EXISTS');
    }

    const home = tie.homeRegistrationId;
    const away = tie.awayRegistrationId;
    const legs = tie.twoLegged
      ? [
          { leg: 1, homeRegistrationId: home, awayRegistrationId: away },
          { leg: 2, homeRegistrationId: away, awayRegistrationId: home },
        ]
      : [{ leg: null, homeRegistrationId: home, awayRegistrationId: away }];

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.match.deleteMany({ where: { tieId, status: 'SCHEDULED' } });
      await tx.match.createMany({
        data: legs.map((l) => ({
          competitionId: tie.competitionId,
          tieId,
          stage: tie.stage,
          leg: l.leg,
          matchday: 1,
          homeRegistrationId: l.homeRegistrationId,
          awayRegistrationId: l.awayRegistrationId,
          scheduledAt: null,
        })),
      });
      return tx.match.findMany({ where: { tieId }, orderBy: { leg: 'asc' } });
    });
  },

  /**
   * Resuelve la llave por marcador global (suma de ida y vuelta) y empuja al
   * ganador a la llave siguiente. Si el global queda empatado hay que designar
   * al ganador a mano con `setWinner` (penales, sorteo, lo que diga el reglamento).
   */
  resolve: async (tieId: string) => {
    const tie = await prisma.knockoutTie.findUnique({
      where: { id: tieId },
      include: { matches: true },
    });
    if (!tie) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    if (!tie.homeRegistrationId || !tie.awayRegistrationId) {
      throw new AppError(422, 'La llave todavía no tiene los dos equipos definidos', 'TIE_INCOMPLETE');
    }
    const pending = tie.matches.filter((m) => m.status !== 'FINISHED');
    if (tie.matches.length === 0 || pending.length > 0) {
      throw new AppError(422, 'Faltan partidos por finalizar en esta llave', 'TIE_PENDING');
    }

    let homeAgg = 0;
    let awayAgg = 0;
    for (const m of tie.matches) {
      if (m.homeRegistrationId === tie.homeRegistrationId) {
        homeAgg += m.homeScore;
        awayAgg += m.awayScore;
      } else {
        homeAgg += m.awayScore;
        awayAgg += m.homeScore;
      }
    }
    if (homeAgg === awayAgg) {
      throw new AppError(
        422,
        'El global quedó empatado: designá el ganador a mano (penales o reglamento)',
        'TIE_DRAWN',
      );
    }
    const winnerId = homeAgg > awayAgg ? tie.homeRegistrationId : tie.awayRegistrationId;
    return knockoutService.setWinner(tieId, winnerId);
  },

  /** Marca el ganador de la llave y lo coloca en la ronda siguiente. */
  setWinner: async (tieId: string, winnerRegistrationId: string) => {
    const tie = await prisma.knockoutTie.findUnique({ where: { id: tieId } });
    if (!tie) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    if (
      winnerRegistrationId !== tie.homeRegistrationId &&
      winnerRegistrationId !== tie.awayRegistrationId
    ) {
      throw new AppError(422, 'El ganador debe ser uno de los dos equipos de la llave', 'BAD_WINNER');
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.knockoutTie.update({
        where: { id: tieId },
        data: { winnerRegistrationId },
        include: tieInclude,
      });
      if (tie.nextTieId) {
        await tx.knockoutTie.update({
          where: { id: tie.nextTieId },
          data: tie.nextSlotIsHome
            ? { homeRegistrationId: winnerRegistrationId }
            : { awayRegistrationId: winnerRegistrationId },
        });
      }
      return updated;
    });
  },

  /** Cuadro completo, agrupado por ronda, para pintar las llaves. */
  bracket: async (competitionId: string) => {
    const ties = await prisma.knockoutTie.findMany({
      where: { competitionId },
      orderBy: [{ stage: 'asc' }, { slot: 'asc' }],
      include: tieInclude,
    });

    const order: MatchStage[] = [MatchStage.R16, MatchStage.QUARTER, MatchStage.SEMI, MatchStage.FINAL];
    return order
      .filter((stage) => ties.some((t) => t.stage === stage))
      .map((stage) => ({
        stage,
        ties: ties.filter((t) => t.stage === stage),
      }));
  },
};
