import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { Prisma } from '@prisma/client';
import { validatePlayerPhotos } from '../players/player-photos';
import type { CreateRosterPlayerDto } from './rosters.schema';

const rosterTransaction = async <T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> => {
  try {
    return await prisma.$transaction(work, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'El jugador ya está registrado o inscrito en esta plantilla', 'DUPLICATE');
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      throw new AppError(409, 'La plantilla cambió mientras guardabas. Vuelve a intentarlo', 'ROSTER_CHANGED');
    }
    throw error;
  }
};

const checkRegistration = async (tx: Prisma.TransactionClient, id: string) => {
  const registration = await tx.teamRegistration.findUnique({ where: { id }, include: { competition: true } });
  if (!registration) throw new AppError(404, 'Inscripción no encontrada', 'NOT_FOUND');
  if (registration.status !== 'ACTIVE' || registration.outcome === 'WITHDRAWN' || registration.competition.status === 'FINISHED') {
    throw new AppError(422, 'Esta inscripción no admite nuevos jugadores', 'REGISTRATION_CLOSED');
  }
  const competition = registration.competition;
  const count = await tx.rosterEntry.count({ where: { teamRegistrationId: id, status: 'ACTIVE' } });
  if (count >= competition.maxPlayers) throw new AppError(422, MESSAGES.rosterFull, 'FULL');
  return registration;
};

const insertRoster = (tx: Prisma.TransactionClient, registration: { id: string; competition: { requiresAdminEligibility: boolean } }, playerId: string, jerseyNumber?: number) =>
  tx.rosterEntry.create({
    data: { teamRegistrationId: registration.id, playerId, jerseyNumber: jerseyNumber ?? null,
      eligibilityApproved: !registration.competition.requiresAdminEligibility, stats: { create: {} } },
    include: { player: true, stats: true },
  });

export const rostersService = {
  /** Reutiliza la identidad del jugador aunque juegue para otro club en otro apartado. */
  candidates: async (teamRegistrationId: string, search: string) => {
    const registration = await prisma.teamRegistration.findUnique({ where: { id: teamRegistrationId }, include: { competition: true } });
    if (!registration) throw new AppError(404, 'Inscripción no encontrada', 'NOT_FOUND');
    const players = await prisma.player.findMany({
      where: {
        status: 'ACTIVE',
        rosterEntries: { none: { teamRegistrationId } },
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { documentNumber: { contains: search } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, documentType: true, documentNumber: true, photoUrl: true, birthDate: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: 20,
    });
    return players.map(({ birthDate, documentNumber, ...player }) => ({
      ...player, documentMasked: `***${documentNumber.slice(-4)}`, eligible: true,
    }));
  },
  list: (teamRegistrationId: string) =>
    prisma.rosterEntry.findMany({
      where: { teamRegistrationId },
      include: { player: true, stats: true },
    }),

  add: (teamRegistrationId: string, playerId: string, jerseyNumber?: number) => rosterTransaction(async (tx) => {
    const player = await tx.player.findUnique({ where: { id: playerId } });
    if (!player) throw new AppError(404, 'Jugador no encontrado', 'NOT_FOUND');
    await validatePlayerPhotos(player);
    if (player.status !== 'ACTIVE') throw new AppError(422, 'Este jugador está inactivo', 'PLAYER_INACTIVE');
    const duplicate = await tx.rosterEntry.findUnique({ where: { playerId_teamRegistrationId: { playerId, teamRegistrationId } } });
    if (duplicate) throw new AppError(409, 'Este jugador ya pertenece a esta plantilla', 'DUPLICATE');
    const registration = await checkRegistration(tx, teamRegistrationId);
    return insertRoster(tx, registration, playerId, jerseyNumber);
  }),

  createPlayer: (teamRegistrationId: string, data: CreateRosterPlayerDto) => rosterTransaction(async (tx) => {
    const { jerseyNumber, ...profile } = data;
    const registration = await checkRegistration(tx, teamRegistrationId);
    await validatePlayerPhotos(profile);
    const existing = await tx.player.findUnique({ where: { documentType_documentNumber: {
      documentType: profile.documentType, documentNumber: profile.documentNumber,
    } } });
    if (existing) throw new AppError(409, MESSAGES.duplicatePlayer, 'DUPLICATE');
    const player = await tx.player.create({ data: profile });
    return insertRoster(tx, registration, player.id, jerseyNumber);
  }),

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
      where: { teamId: reg.teamId, id: { not: teamRegistrationId }, competition: { ageGroup: reg.competition.ageGroup } },
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

    const players = source.roster.map((e) => {
      return {
        playerId: e.player.id,
        firstName: e.player.firstName,
        lastName: e.player.lastName,
        documentNumber: e.player.documentNumber,
        photoUrl: e.player.photoUrl,
        photosComplete: !!e.player.photoUrl && !!e.player.identityPhotoKey,
        jerseyNumber: e.jerseyNumber,
        alreadyInRoster: already.has(e.player.id),
        // Compatibility with older clients: age no longer excludes players.
        outOfAge: false,
      };
    });

    return {
      source: {
        registrationId: source.id,
        ageGroup: source.competition.ageGroup,
        competitionName: source.competition.name,
        editionName: source.competition.edition?.name ?? null,
        editionYear: source.competition.edition?.year ?? null,
      },
      players,
      importable: players.filter((p) => !p.alreadyInRoster && p.photosComplete).length,
    };
  },

  /**
   * Copia la plantilla del torneo anterior a esta inscripción.
   *
   * Salta a quien ya esté cargado y se detiene en el cupo.
   * Devuelve qué entró y qué quedó
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
      if (slots <= 0) {
        skipped.push({ name, reason: 'La plantilla llegó al cupo' });
        continue;
      }
      try { await rostersService.add(teamRegistrationId, p.playerId, p.jerseyNumber ?? undefined); }
      catch (error) {
        if (error instanceof AppError && error.statusCode === 422) { skipped.push({ name, reason: error.message }); continue; }
        throw error;
      }
      slots -= 1;
      added.push(name);
    }

    return { source: preview.source, added, skipped };
  },

  setEligibility: (id: string, eligibilityApproved: boolean) =>
    prisma.rosterEntry.update({ where: { id }, data: { eligibilityApproved } }),

  update: async (id: string, data: { jerseyNumber?: number; status?: 'ACTIVE' | 'INACTIVE' }) => {
    if (data.status === 'ACTIVE') return rosterTransaction(async (tx) => {
      const entry = await tx.rosterEntry.findUnique({ where: { id }, include: { player: true } });
      if (!entry) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
      await validatePlayerPhotos(entry.player);
      if (entry.status !== 'ACTIVE') await checkRegistration(tx, entry.teamRegistrationId);
      return tx.rosterEntry.update({ where: { id }, data });
    });
    return prisma.rosterEntry.update({ where: { id }, data });
  },

  remove: (id: string) =>
    prisma.rosterEntry.update({ where: { id }, data: { status: 'INACTIVE' } }),
};
