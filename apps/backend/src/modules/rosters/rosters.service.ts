import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { calcAge } from '@/utils/date.util';

export const rostersService = {
  list: (teamRegistrationId: string) =>
    prisma.rosterEntry.findMany({
      where: { teamRegistrationId },
      include: { player: true, stats: true },
    }),

  add: async (teamRegistrationId: string, playerId: string, jerseyNumber?: number) => {
    const reg = await prisma.teamRegistration.findUnique({
      where: { id: teamRegistrationId },
      include: { competition: true },
    });
    if (!reg) throw new AppError(404, 'Inscripción no encontrada', 'NOT_FOUND');
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new AppError(404, 'Jugador no encontrado', 'NOT_FOUND');

    const comp = reg.competition;
    const age = calcAge(player.birthDate);
    if (comp.ageMin != null && age < comp.ageMin) {
      throw new AppError(422, MESSAGES.notEligibleAge, 'AGE');
    }
    if (comp.ageMax != null && age > comp.ageMax) {
      throw new AppError(422, MESSAGES.notEligibleAge, 'AGE');
    }

    const count = await prisma.rosterEntry.count({
      where: { teamRegistrationId, status: 'ACTIVE' },
    });
    if (count >= comp.maxPlayers) {
      throw new AppError(422, MESSAGES.rosterFull, 'FULL');
    }

    return prisma.rosterEntry.create({
      data: {
        teamRegistrationId,
        playerId,
        jerseyNumber: jerseyNumber ?? null,
        eligibilityApproved: !comp.requiresAdminEligibility,
        stats: { create: {} },
      },
      include: { player: true, stats: true },
    });
  },

  /**
   * Plantilla del torneo anterior de este mismo equipo.
   *
   * Al terminar un torneo el plantel no se rehace de cero: casi siempre siguen
   * los mismos. Se ofrece la última plantilla que el equipo armó para que se
   * traiga de un tirón, y después se quita a quien no siga. No se copia sola:
   * quién juega el torneo que viene es una decisión, no un arrastre.
   */
  previous: async (teamRegistrationId: string) => {
    const reg = await prisma.teamRegistration.findUnique({
      where: { id: teamRegistrationId },
      include: { competition: true },
    });
    if (!reg) throw new AppError(404, 'Inscripción no encontrada', 'NOT_FOUND');

    const others = await prisma.teamRegistration.findMany({
      where: { teamId: reg.teamId, id: { not: teamRegistrationId } },
      include: {
        competition: { include: { edition: { select: { id: true, name: true, year: true } } } },
        roster: {
          where: { status: 'ACTIVE' },
          include: { player: true },
        },
      },
    });

    /*
      La más reciente que tenga gente: se ordena por año de edición y, dentro
      del mismo año, por cuál se creó después.
    */
    const source = others
      .filter((o) => o.roster.length > 0)
      .sort(
        (a, b) =>
          (b.competition.edition?.year ?? 0) - (a.competition.edition?.year ?? 0) ||
          b.createdAt.getTime() - a.createdAt.getTime(),
      )[0];

    if (!source) return null;

    const current = await prisma.rosterEntry.findMany({
      where: { teamRegistrationId },
      select: { playerId: true },
    });
    const already = new Set(current.map((c) => c.playerId));

    const comp = reg.competition;
    const players = source.roster.map((e) => {
      const age = calcAge(e.player.birthDate);
      const outOfAge =
        (comp.ageMin != null && age < comp.ageMin) || (comp.ageMax != null && age > comp.ageMax);
      return {
        playerId: e.player.id,
        firstName: e.player.firstName,
        lastName: e.player.lastName,
        documentNumber: e.player.documentNumber,
        photoUrl: e.player.photoUrl,
        jerseyNumber: e.jerseyNumber,
        alreadyInRoster: already.has(e.player.id),
        // Se avisa antes de importar, no después de que el servidor rechace.
        outOfAge,
      };
    });

    return {
      source: {
        registrationId: source.id,
        competitionName: source.competition.name,
        editionName: source.competition.edition?.name ?? null,
        editionYear: source.competition.edition?.year ?? null,
      },
      players,
      importable: players.filter((p) => !p.alreadyInRoster && !p.outOfAge).length,
    };
  },

  /**
   * Copia la plantilla del torneo anterior a esta inscripción.
   *
   * Salta a quien ya esté cargado y a quien no cumpla la edad de la
   * competición, y se detiene en el cupo. Devuelve qué entró y qué quedó
   * afuera con su motivo: importar a medias en silencio deja al administrador
   * creyendo que la plantilla está completa.
   */
  importPrevious: async (teamRegistrationId: string) => {
    const preview = await rostersService.previous(teamRegistrationId);
    if (!preview) {
      throw new AppError(
        404,
        'Este equipo no tiene una plantilla anterior para traer',
        'NO_PREVIOUS',
      );
    }

    const reg = await prisma.teamRegistration.findUnique({
      where: { id: teamRegistrationId },
      include: { competition: true },
    });
    if (!reg) throw new AppError(404, 'Inscripción no encontrada', 'NOT_FOUND');
    const comp = reg.competition;

    let slots =
      comp.maxPlayers -
      (await prisma.rosterEntry.count({ where: { teamRegistrationId, status: 'ACTIVE' } }));

    const added: string[] = [];
    const skipped: Array<{ name: string; reason: string }> = [];

    for (const p of preview.players) {
      const name = `${p.firstName} ${p.lastName}`;
      if (p.alreadyInRoster) {
        skipped.push({ name, reason: 'Ya estaba en la plantilla' });
        continue;
      }
      if (p.outOfAge) {
        skipped.push({ name, reason: 'No cumple el rango de edad de esta competición' });
        continue;
      }
      if (slots <= 0) {
        skipped.push({ name, reason: 'La plantilla llegó al cupo' });
        continue;
      }
      await prisma.rosterEntry.create({
        data: {
          teamRegistrationId,
          playerId: p.playerId,
          // El dorsal viene del torneo anterior; se puede cambiar después.
          jerseyNumber: p.jerseyNumber,
          eligibilityApproved: !comp.requiresAdminEligibility,
          stats: { create: {} },
        },
      });
      slots -= 1;
      added.push(name);
    }

    return { source: preview.source, added, skipped };
  },

  setEligibility: (id: string, eligibilityApproved: boolean) =>
    prisma.rosterEntry.update({ where: { id }, data: { eligibilityApproved } }),

  update: (id: string, data: { jerseyNumber?: number; status?: 'ACTIVE' | 'INACTIVE' }) =>
    prisma.rosterEntry.update({ where: { id }, data }),

  remove: (id: string) =>
    prisma.rosterEntry.update({ where: { id }, data: { status: 'INACTIVE' } }),
};
