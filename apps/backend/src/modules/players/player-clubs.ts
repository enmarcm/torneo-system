import { Prisma, type CompetitionAgeGroup } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';

type Tx = Prisma.TransactionClient;

const SECTION: Record<CompetitionAgeGroup, string> = { ADULT: 'Adultos', YOUTH: 'Menores' };

/**
 * Toma el pase de un jugador para un equipo en un apartado.
 *
 * Quien lo tiene lo conserva hasta que lo libere: otro equipo no puede
 * inscribirlo, ni desde la búsqueda ni creándolo de nuevo. Un jugador puede
 * estar en Menores de un club y en Adultos de otro; el pase es por apartado.
 * Si el pase ya es de este equipo no hace nada.
 */
export const claimPlayer = async (tx: Tx, playerId: string, teamId: string, ageGroup: CompetitionAgeGroup) => {
  const club = await tx.playerClub.findUnique({
    where: { playerId_ageGroup: { playerId, ageGroup } },
    include: { team: { select: { name: true } }, player: { select: { firstName: true, lastName: true } } },
  });
  if (!club) {
    await tx.playerClub.create({ data: { playerId, teamId, ageGroup } });
    return;
  }
  if (club.teamId !== teamId) {
    throw new AppError(
      409,
      `${club.player.firstName} ${club.player.lastName} pertenece a ${club.team.name} en ${SECTION[ageGroup]}. Su delegado o el administrador debe liberarlo antes de inscribirlo en otro equipo`,
      'PLAYER_HELD',
    );
  }
};

export const playerClubs = {
  /** Pases vigentes de un equipo o de todos, con el jugador para mostrarlos en una lista. */
  holds: (filter: { teamId?: string; ageGroup?: CompetitionAgeGroup }) =>
    prisma.playerClub.findMany({
      where: { ...(filter.teamId ? { teamId: filter.teamId } : {}), ...(filter.ageGroup ? { ageGroup: filter.ageGroup } : {}) },
      select: {
        id: true,
        ageGroup: true,
        teamId: true,
        team: { select: { id: true, name: true } },
        player: { select: { id: true, firstName: true, lastName: true, photoUrl: true, status: true } },
      },
      orderBy: [{ player: { lastName: 'asc' } }, { player: { firstName: 'asc' } }],
    }),

  /**
   * Libera al jugador en un apartado: se borra el pase y se da de baja de las
   * plantillas vigentes de ese club en el apartado, para que no quede jugando
   * en dos equipos a la vez. Las plantillas de torneos terminados no se tocan:
   * son su historial.
   *
   * El delegado solo libera a quien tiene su equipo; el administrador, a cualquiera.
   */
  release: async (playerId: string, ageGroup: CompetitionAgeGroup, actor: { role: string; teamId?: string | null }) => {
    const club = await prisma.playerClub.findUnique({ where: { playerId_ageGroup: { playerId, ageGroup } } });
    if (!club) throw new AppError(404, `Este jugador ya está libre en ${SECTION[ageGroup]}`, 'NOT_HELD');
    if (actor.role === 'TEAM_LEADER' && club.teamId !== actor.teamId) {
      throw new AppError(403, MESSAGES.forbidden, 'FORBIDDEN');
    }
    return prisma.$transaction(async (tx) => {
      await tx.playerClub.delete({ where: { id: club.id } });
      const { count } = await tx.rosterEntry.updateMany({
        where: {
          playerId,
          status: 'ACTIVE',
          teamRegistration: { teamId: club.teamId, competition: { ageGroup, status: { not: 'FINISHED' } } },
        },
        data: { status: 'INACTIVE' },
      });
      return { playerId, ageGroup, teamId: club.teamId, deactivatedEntries: count };
    }, { isolationLevel: 'Serializable' });
  },
};
