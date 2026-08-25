import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { purgePlayer, CASCADE_TX } from '@/utils/cascade.util';
import type { CreatePlayerDto } from './players.schema';

export const playersService = {
  list: (search?: string) =>
    prisma.player.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { documentNumber: { contains: search } },
            ],
          }
        : {},
      orderBy: { lastName: 'asc' },
      take: 50,
    }),

  byDocument: (documentType: 'CEDULA' | 'PARTIDA', documentNumber: string) =>
    prisma.player.findUnique({
      where: { documentType_documentNumber: { documentType, documentNumber } },
    }),

  get: async (id: string) => {
    const p = await prisma.player.findUnique({ where: { id } });
    if (!p) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return p;
  },

  create: async (data: CreatePlayerDto) => {
    const exists = await prisma.player.findUnique({
      where: {
        documentType_documentNumber: {
          documentType: data.documentType,
          documentNumber: data.documentNumber,
        },
      },
    });
    if (exists) throw new AppError(409, MESSAGES.duplicatePlayer, 'DUPLICATE');
    return prisma.player.create({ data });
  },

  update: (id: string, data: Partial<CreatePlayerDto>) =>
    prisma.player.update({ where: { id }, data }),

  setStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') =>
    prisma.player.update({ where: { id }, data: { status } }),

  setDegree: (id: string, data: { universityDegreeVerified: boolean; degreeDocUrl?: string }) =>
    prisma.player.update({ where: { id }, data }),

  /**
   * Ficha pública de un jugador, buscada por su documento.
   *
   * Se exige el número completo a propósito: es lo único que impide que
   * cualquiera liste las fichas de toda la liga sin conocer a nadie. Por la
   * misma razón la respuesta devuelve el documento enmascarado, así la ficha
   * no sirve para cosechar cédulas si alguien comparte el enlace.
   */
  publicProfile: async (document: string) => {
    const raw = document.trim();
    if (raw.length < 4) return null;
    // El documento se escribe de muchas formas (V-12.345.678, 12345678…).
    const clean = raw.replace(/[^0-9a-zA-Z]/g, '');

    const player = await prisma.player.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [{ documentNumber: raw }, { documentNumber: clean }],
      },
    });
    if (!player) return null;

    const entries = await prisma.rosterEntry.findMany({
      where: { playerId: player.id },
      include: {
        stats: true,
        teamRegistration: {
          include: {
            team: { select: { id: true, name: true, logoUrl: true } },
            competition: {
              select: {
                id: true,
                name: true,
                kind: true,
                format: true,
                division: true,
                divisionLevel: true,
                editionId: true,
                category: { select: { id: true, name: true } },
                edition: { select: { id: true, name: true, year: true } },
              },
            },
          },
        },
      },
    });

    const totals = entries.reduce(
      (acc, e) => ({
        matchesPlayed: acc.matchesPlayed + (e.stats?.matchesPlayed ?? 0),
        goals: acc.goals + (e.stats?.goals ?? 0),
        yellowCards: acc.yellowCards + (e.stats?.yellowCards ?? 0),
        redCards: acc.redCards + (e.stats?.redCards ?? 0),
      }),
      { matchesPlayed: 0, goals: 0, yellowCards: 0, redCards: 0 },
    );

    // Lo más reciente primero: es lo que se busca cuando se consulta una ficha.
    const career = entries
      .map((e) => ({
        rosterEntryId: e.id,
        jerseyNumber: e.jerseyNumber,
        status: e.status,
        team: e.teamRegistration.team,
        competition: e.teamRegistration.competition,
        edition: e.teamRegistration.competition.edition,
        stats: {
          matchesPlayed: e.stats?.matchesPlayed ?? 0,
          goals: e.stats?.goals ?? 0,
          yellowCards: e.stats?.yellowCards ?? 0,
          redCards: e.stats?.redCards ?? 0,
        },
      }))
      .sort((a, b) => (b.edition?.year ?? 0) - (a.edition?.year ?? 0));

    const teams = [...new Map(career.map((c) => [c.team.id, c.team])).values()];

    return {
      player: {
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        photoUrl: player.photoUrl,
        // Solo los últimos tres dígitos, para confirmar que es quien se buscaba.
        documentMasked: `••••${clean.slice(-3)}`,
      },
      totals,
      teams,
      career,
    };
  },

  competitions: (id: string) =>
    prisma.rosterEntry.findMany({
      where: { playerId: id },
      include: {
        teamRegistration: { include: { team: true, competition: { include: { category: true } } } },
        stats: true,
      },
    }),

  /**
   * Borrado definitivo y en cascada: se lleva sus plantillas, estadísticas,
   * los goles y las tarjetas que registró en partidos ya jugados.
   */
  remove: async (id: string) => {
    const player = await prisma.player.findUnique({ where: { id } });
    if (!player) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

    return prisma.$transaction(
      async (tx) => {
        await purgePlayer(tx, id);
        return { id };
      },
      CASCADE_TX,
    );
  },
};
