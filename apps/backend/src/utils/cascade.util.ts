import type { Prisma } from '@prisma/client';

/**
 * Borrado en cascada a mano.
 *
 * El administrador manda: si decide eliminar algo, se elimina, tenga o no
 * historial colgando. Prisma no cascadea estas relaciones, así que acá se
 * barren los hijos en orden (de la hoja a la raíz) antes de borrar el padre.
 *
 * Todo se ejecuta dentro de la transacción que abre el servicio: o se va todo
 * junto, o no se va nada.
 */
type Tx = Prisma.TransactionClient;

const idsOf = (rows: Array<{ id: string }>) => rows.map((r) => r.id);

/** Opciones para el $transaction de los borrados grandes (una edición entera tarda). */
export const CASCADE_TX = { timeout: 60_000, maxWait: 10_000 };

/**
 * Inscripciones: se llevan sus partidos, eventos, plantillas, estadísticas y
 * traspasos. Las llaves del cuadro no se borran, quedan sin equipo asignado.
 */
export const purgeRegistrations = async (tx: Tx, registrationIds: string[]) => {
  if (registrationIds.length === 0) return;

  const matches = await tx.match.findMany({
    where: {
      OR: [
        { homeRegistrationId: { in: registrationIds } },
        { awayRegistrationId: { in: registrationIds } },
      ],
    },
    select: { id: true },
  });

  await tx.matchEvent.deleteMany({
    where: {
      OR: [
        { matchId: { in: idsOf(matches) } },
        { teamRegistrationId: { in: registrationIds } },
      ],
    },
  });
  await tx.match.deleteMany({ where: { id: { in: idsOf(matches) } } });

  await tx.transfer.deleteMany({
    where: {
      OR: [
        { fromRegistrationId: { in: registrationIds } },
        { toRegistrationId: { in: registrationIds } },
      ],
    },
  });

  // La llave sobrevive al equipo: se queda vacía, no se borra el cuadro entero.
  await tx.knockoutTie.updateMany({
    where: { homeRegistrationId: { in: registrationIds } },
    data: { homeRegistrationId: null },
  });
  await tx.knockoutTie.updateMany({
    where: { awayRegistrationId: { in: registrationIds } },
    data: { awayRegistrationId: null },
  });
  await tx.knockoutTie.updateMany({
    where: { winnerRegistrationId: { in: registrationIds } },
    data: { winnerRegistrationId: null },
  });

  const roster = await tx.rosterEntry.findMany({
    where: { teamRegistrationId: { in: registrationIds } },
    select: { id: true },
  });
  await tx.playerSeasonStats.deleteMany({ where: { rosterEntryId: { in: idsOf(roster) } } });
  await tx.rosterEntry.deleteMany({ where: { id: { in: idsOf(roster) } } });

  await tx.teamRegistration.deleteMany({ where: { id: { in: registrationIds } } });
};

/** Competiciones: partidos, eventos, llaves, grupos, sanciones e inscripciones. */
export const purgeCompetitions = async (tx: Tx, competitionIds: string[]) => {
  if (competitionIds.length === 0) return;

  const matches = await tx.match.findMany({
    where: { competitionId: { in: competitionIds } },
    select: { id: true },
  });
  await tx.matchEvent.deleteMany({ where: { matchId: { in: idsOf(matches) } } });
  await tx.match.deleteMany({ where: { id: { in: idsOf(matches) } } });

  const registrations = await tx.teamRegistration.findMany({
    where: { competitionId: { in: competitionIds } },
    select: { id: true },
  });
  await purgeRegistrations(tx, idsOf(registrations));

  await tx.knockoutTie.deleteMany({ where: { competitionId: { in: competitionIds } } });
  await tx.teamBlock.deleteMany({ where: { competitionId: { in: competitionIds } } });
  await tx.competitionGroup.deleteMany({ where: { competitionId: { in: competitionIds } } });
  await tx.competition.deleteMany({ where: { id: { in: competitionIds } } });
};

/** Usuario: el historial de auditoría y las sanciones que firmó se quedan sin autor. */
export const purgeUser = async (tx: Tx, userId: string) => {
  await tx.auditLog.updateMany({ where: { userId }, data: { userId: null } });
  await tx.teamBlock.updateMany({ where: { blockedById: userId }, data: { blockedById: null } });
  await tx.teamBlock.updateMany({ where: { liftedById: userId }, data: { liftedById: null } });
  await tx.user.delete({ where: { id: userId } });
};

/** Jugador: eventos, plantillas, estadísticas y traspasos. Deja de ser MVP donde lo era. */
export const purgePlayer = async (tx: Tx, playerId: string) => {
  await tx.matchEvent.deleteMany({ where: { playerId } });
  await tx.match.updateMany({ where: { mvpPlayerId: playerId }, data: { mvpPlayerId: null } });
  await tx.transfer.deleteMany({ where: { playerId } });

  const roster = await tx.rosterEntry.findMany({ where: { playerId }, select: { id: true } });
  await tx.playerSeasonStats.deleteMany({ where: { rosterEntryId: { in: idsOf(roster) } } });
  await tx.rosterEntry.deleteMany({ where: { id: { in: idsOf(roster) } } });

  await tx.player.delete({ where: { id: playerId } });
};

/** Equipo: sus inscripciones (con todo lo que cuelga), sanciones y usuario líder. */
export const purgeTeam = async (tx: Tx, teamId: string, leaderId?: string | null) => {
  const registrations = await tx.teamRegistration.findMany({
    where: { teamId },
    select: { id: true },
  });
  await purgeRegistrations(tx, idsOf(registrations));
  await tx.teamBlock.deleteMany({ where: { teamId } });
  if (leaderId) await purgeUser(tx, leaderId);
  await tx.team.delete({ where: { id: teamId } });
};
