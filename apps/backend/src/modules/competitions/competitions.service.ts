import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { purgeCompetitions, CASCADE_TX } from '@/utils/cascade.util';
import { Prisma, type CompetitionAgeGroup, type CompetitionKind } from '@prisma/client';
import type { CreateCompetitionDto } from './competitions.schema';

/**
 * Devuelve el sistema de liga de una edición, creándolo si todavía no existe.
 *
 * Cada apartado de la edición tiene su liga, que entrelaza a Primera, Segunda y
 * Tercera entre sí: sin ese vínculo el ascenso y el descenso no tienen contra
 * qué operar, y la Copa no sabe de dónde salen sus equipos. Se resuelve solo
 * para que el administrador no tenga que mantenerlo a mano.
 */
const ensureLeagueSystem = async (editionId: string, ageGroup: CompetitionAgeGroup) => {
  const existing = await prisma.leagueSystem.findFirst({ where: { editionId, ageGroup } });
  if (existing) return existing;
  const edition = await prisma.edition.findUnique({ where: { id: editionId } });
  if (!edition) throw new AppError(404, 'Edición no encontrada', 'NOT_FOUND');
  return prisma.leagueSystem.create({
    data: { editionId, ageGroup, name: `Liga ${edition.name} - ${ageGroup === 'ADULT' ? 'Adultos' : 'Menores'}` },
  });
};

/**
 * Resuelve a qué liga se engancha la competición según su tipo:
 * una división pertenece a la liga de su edición, y una copa se nutre de ella.
 */
const resolveLeagueLinks = async (
  editionId: string,
  kind: CompetitionKind,
  ageGroup: CompetitionAgeGroup,
  explicit: { leagueSystemId?: string | null; sourceLeagueSystemId?: string | null },
) => {
  // Independent leagues never participate in promotion/relegation systems.
  if (kind !== 'LEAGUE_DIVISION' && kind !== 'CUP') {
    return { leagueSystemId: null, sourceLeagueSystemId: null };
  }
  const systemId = kind === 'LEAGUE_DIVISION' ? explicit.leagueSystemId : explicit.sourceLeagueSystemId;
  if (systemId) {
    const system = await prisma.leagueSystem.findUnique({ where: { id: systemId } });
    if (!system || system.editionId !== editionId || system.ageGroup !== ageGroup) {
      throw new AppError(422, 'La liga debe pertenecer a la misma edición y apartado', 'LEAGUE_SCOPE_MISMATCH');
    }
    return kind === 'LEAGUE_DIVISION'
      ? { leagueSystemId: systemId, sourceLeagueSystemId: null }
      : { leagueSystemId: null, sourceLeagueSystemId: systemId };
  }
  if (kind === 'LEAGUE_DIVISION') {
    const system = await ensureLeagueSystem(editionId, ageGroup);
    return { leagueSystemId: system.id, sourceLeagueSystemId: null };
  }
  if (kind === 'CUP') {
    const system = await ensureLeagueSystem(editionId, ageGroup);
    return { leagueSystemId: null, sourceLeagueSystemId: system.id };
  }
  return { leagueSystemId: null, sourceLeagueSystemId: null };
};

/**
 * Reglas fijas de la eliminatoria de la liga, por nivel de división:
 *  - Primera y Segunda arrancan en CUARTOS  → clasifican 8 equipos.
 *  - Tercera arranca en OCTAVOS             → clasifican 16 equipos.
 *  - Siempre a PARTIDO ÚNICO: la liga nunca juega ida y vuelta.
 *
 * La ida y vuelta queda reservada para la Copa, que sí la usa desde octavos.
 */
const LEAGUE_KNOCKOUT_QUALIFIERS: Record<number, number> = { 1: 8, 2: 8, 3: 16 };
const LEAGUE_KNOCKOUT_FALLBACK = 16;

/** La liga se juega en tres divisiones: Primera (1), Segunda (2) y Tercera (3). */
const TOP_DIVISION = 1;
const BOTTOM_DIVISION = 3;

/**
 * La división más alta no puede tener ascenso y la más baja no puede tener
 * descenso: no hay categoría por encima ni por debajo. Se fuerza en el servidor
 * para que no dependa de que la pantalla lo esconda.
 */
const clampSpots = (
  divisionLevel: number | null,
  promotionSpots: number,
  relegationSpots: number,
) => ({
  promotionSpots: divisionLevel === TOP_DIVISION ? 0 : promotionSpots,
  relegationSpots: divisionLevel === BOTTOM_DIVISION ? 0 : relegationSpots,
});

/**
 * Aplica esas reglas a una división de liga. Se recalcula cada vez que se crea o
 * se cambia el nivel, para que un cambio de división ajuste solo su eliminatoria.
 */
const leagueKnockoutRules = (kind: CompetitionKind, divisionLevel: number | null) => {
  if (kind !== 'LEAGUE_DIVISION') return null;
  return {
    knockoutQualifiers:
      divisionLevel != null
        ? (LEAGUE_KNOCKOUT_QUALIFIERS[divisionLevel] ?? LEAGUE_KNOCKOUT_FALLBACK)
        : LEAGUE_KNOCKOUT_FALLBACK,
    twoLeggedStages: [],
  };
};

/** Dos divisiones del mismo nivel en una misma liga romperían el ascenso/descenso. */
const assertLevelIsFree = async (
  leagueSystemId: string,
  divisionLevel: number,
  ignoreCompetitionId?: string,
) => {
  const taken = await prisma.competition.findFirst({
    where: {
      leagueSystemId,
      divisionLevel,
      ...(ignoreCompetitionId ? { id: { not: ignoreCompetitionId } } : {}),
    },
    select: { name: true },
  });
  if (taken) {
    throw new AppError(
      409,
      `En esta edición ya existe "${taken.name}" ocupando ese nivel de división`,
      'DIVISION_LEVEL_TAKEN',
    );
  }
};

const validateStructure = (kind: CompetitionKind, format: string, divisionLevel: number | null) => {
  if (kind === 'LEAGUE_DIVISION' && (divisionLevel == null || divisionLevel < 1 || divisionLevel > 3)) {
    throw new AppError(422, 'Selecciona Primera, Segunda o Tercera para esta liga con divisiones', 'DIVISION_REQUIRED');
  }
  if ((kind === 'STANDALONE_LEAGUE' || kind === 'LEAGUE_DIVISION') && format !== 'LEAGUE') {
    throw new AppError(422, 'Una liga se juega todos contra todos', 'INVALID_LEAGUE_FORMAT');
  }
};

const validateRules = (rules: { ageMin?: number | null; ageMax?: number | null; minPlayers?: number; maxPlayers?: number }) => {
  if (rules.ageMin != null && rules.ageMax != null && rules.ageMin > rules.ageMax) {
    throw new AppError(422, 'La edad mínima no puede superar la máxima', 'INVALID_AGE_RANGE');
  }
  if ((rules.minPlayers ?? 11) > (rules.maxPlayers ?? 25)) {
    throw new AppError(422, 'El cupo mínimo no puede superar el máximo', 'INVALID_ROSTER_LIMITS');
  }
};

export const competitionsService = {
  list: (editionId?: string) =>
    prisma.competition.findMany({
      where: editionId ? { editionId } : {},
      include: { _count: { select: { registrations: true, matches: true } } },
      orderBy: { createdAt: 'desc' },
    }),

  /**
   * Inscripciones de una edición o de una competición concreta. La pantalla
   * pública de equipos las agrupa por torneo, para que se vea qué club juega
   * en cada división, en la copa o en las categorías de menores.
   */
  registrations: (filters: { editionId?: string; competitionId?: string } = {}) =>
    prisma.teamRegistration.findMany({
      where: {
        status: 'ACTIVE',
        ...(filters.competitionId ? { competitionId: filters.competitionId } : {}),
        ...(filters.editionId ? { competition: { editionId: filters.editionId } } : {}),
      },
      include: {
        team: { select: { id: true, name: true, logoUrl: true, status: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { team: { name: 'asc' } },
    }),

  publicRoster: async (registrationId: string) => {
    const registration = await prisma.teamRegistration.findUnique({
      where: { id: registrationId },
      select: {
        status: true,
        roster: {
          where: { status: 'ACTIVE', player: { status: 'ACTIVE' } },
          orderBy: [{ player: { lastName: 'asc' } }, { player: { firstName: 'asc' } }],
          select: {
            id: true,
            jerseyNumber: true,
            player: { select: { id: true, firstName: true, lastName: true, photoUrl: true, position: true } },
            stats: { select: { goals: true, matchesPlayed: true } },
          },
        },
      },
    });
    if (!registration || registration.status !== 'ACTIVE') {
      throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    }
    return registration.roster;
  },

  get: async (id: string) => {
    const c = await prisma.competition.findUnique({
      where: { id },
      include: {
        leagueSystem: { include: { divisions: { orderBy: { divisionLevel: 'asc' } } } },
        sourceLeagueSystem: { include: { divisions: { orderBy: { divisionLevel: 'asc' } } } },
        groups: { include: { registrations: { include: { team: true } } } },
        registrations: { include: { team: true, roster: { include: { player: true } } } },
      },
    });
    if (!c) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return c;
  },

  create: async (d: CreateCompetitionDto) => {
    validateRules(d);
    const kind = d.kind ?? 'STANDALONE_LEAGUE';
    const ageGroup = d.ageGroup ?? (kind === 'YOUTH' ? 'YOUTH' : 'ADULT');
    const divisionLevel = kind === 'LEAGUE_DIVISION' ? (d.divisionLevel ?? null) : null;
    validateStructure(kind, d.format ?? 'LEAGUE', divisionLevel);
    const links = await resolveLeagueLinks(d.editionId, kind, ageGroup, {
      leagueSystemId: d.leagueSystemId,
      sourceLeagueSystemId: d.sourceLeagueSystemId,
    });
    if (links.leagueSystemId && divisionLevel != null) {
      await assertLevelIsFree(links.leagueSystemId, divisionLevel);
    }
    // En la liga, la eliminatoria no se configura a mano: sale del nivel.
    const knockout = leagueKnockoutRules(kind, divisionLevel ?? null);

    return prisma.competition.create({
      data: {
        editionId: d.editionId,
        name: d.name,
        description: d.description ?? null,
        format: d.format ?? 'LEAGUE',
        kind,
        ageGroup,
        imageUrl: d.imageUrl ?? null,
        division: kind === 'LEAGUE_DIVISION' ? (d.division ?? null) : null,
        divisionLevel,
        leagueSystemId: links.leagueSystemId,
        sourceLeagueSystemId: links.sourceLeagueSystemId,
        rounds: d.rounds ?? 1,
        twoLeggedStages: knockout ? knockout.twoLeggedStages : (d.twoLeggedStages ?? []),
        ...(kind === 'LEAGUE_DIVISION'
          ? clampSpots(divisionLevel ?? null, d.promotionSpots ?? 0, d.relegationSpots ?? 0)
          : { promotionSpots: 0, relegationSpots: 0 }),
        ageMin: d.ageMin ?? null,
        ageMax: d.ageMax ?? null,
        requiresAdminEligibility: d.requiresAdminEligibility ?? false,
        minPlayers: d.minPlayers ?? 11,
        maxPlayers: d.maxPlayers ?? 25,
        manualTeamSelection: d.manualTeamSelection ?? (d.format === 'GROUPS_KNOCKOUT'),
        knockoutQualifiers: knockout ? knockout.knockoutQualifiers : (d.knockoutQualifiers ?? null),
        numGroups: d.numGroups ?? null,
        groupSize: d.groupSize ?? null,
        qualifiersPerGroup: d.qualifiersPerGroup ?? null,
      },
    });
  },

  update: async (id: string, data: Partial<CreateCompetitionDto>) => {
    const current = await prisma.competition.findUnique({ where: { id } });
    if (!current) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

    validateRules({ ...current, ...data });
    const kind = data.kind ?? current.kind;
    const ageGroup = data.ageGroup ?? current.ageGroup;
    const editionId = data.editionId ?? current.editionId;
    const divisionLevel = kind === 'LEAGUE_DIVISION'
      ? (data.divisionLevel !== undefined ? data.divisionLevel : current.divisionLevel)
      : null;
    validateStructure(kind, data.format ?? current.format, divisionLevel);
    const changedScope = ageGroup !== current.ageGroup || editionId !== current.editionId || kind !== current.kind;
    const links = await resolveLeagueLinks(editionId, kind, ageGroup, {
      leagueSystemId: data.leagueSystemId !== undefined ? data.leagueSystemId : (changedScope ? null : current.leagueSystemId),
      sourceLeagueSystemId: data.sourceLeagueSystemId !== undefined ? data.sourceLeagueSystemId : (changedScope ? null : current.sourceLeagueSystemId),
    });

    if (links.leagueSystemId && divisionLevel != null) {
      await assertLevelIsFree(links.leagueSystemId, divisionLevel, id);
    }
    // Si pasa de Tercera a Primera, su eliminatoria debe pasar de octavos a
    // cuartos sola: por eso se recalcula en cada guardado.
    const knockout = leagueKnockoutRules(kind, divisionLevel ?? null);

    return prisma.competition.update({
      where: { id },
      data: {
        ...data,
        kind,
        ageGroup,
        division: kind === 'LEAGUE_DIVISION' ? (data.division !== undefined ? data.division : current.division) : null,
        divisionLevel,
        ...links,
        ...(knockout ?? (current.kind === 'LEAGUE_DIVISION' ? { knockoutQualifiers: data.knockoutQualifiers ?? null, twoLeggedStages: data.twoLeggedStages ?? [] } : {})),
        ...(kind === 'LEAGUE_DIVISION'
          ? clampSpots(
              divisionLevel ?? null,
              data.promotionSpots ?? current.promotionSpots,
              data.relegationSpots ?? current.relegationSpots,
            )
          : { promotionSpots: 0, relegationSpots: 0 }),
      },
    });
  },

  setStatus: (id: string, status: 'DRAFT' | 'ACTIVE' | 'FINISHED') =>
    prisma.competition.update({ where: { id }, data: { status } }),

  /**
   * Borrado definitivo y en cascada. Se lleva inscripciones, partidos, eventos,
   * grupos, llaves y sanciones de la competición. No hay red de seguridad: si el
   * administrador la borra, la temporada de ese torneo desaparece con ella.
   */
  remove: async (id: string) => {
    const competition = await prisma.competition.findUnique({ where: { id } });
    if (!competition) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

    return prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        await purgeCompetitions(tx, [id]);
        return { id };
      },
      CASCADE_TX,
    );
  },

  /**
   * Ascenso / descenso / no participa. Es una decisión del administrador sobre
   * la inscripción, independiente de dónde haya quedado el equipo en la tabla.
   */
  setRegistrationOutcome: async (
    registrationId: string,
    outcome: 'NONE' | 'PROMOTED' | 'RELEGATED' | 'WITHDRAWN',
    outcomeNote?: string,
  ) => {
    const reg = await prisma.teamRegistration.findUnique({ where: { id: registrationId }, include: { competition: { select: { kind: true } } } });
    if (!reg) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    if ((outcome === 'PROMOTED' || outcome === 'RELEGATED') && reg.competition.kind !== 'LEAGUE_DIVISION') {
      throw new AppError(422, 'El ascenso y el descenso solo aplican a ligas con divisiones', 'DIVISION_OUTCOME_REQUIRED');
    }
    return prisma.teamRegistration.update({
      where: { id: registrationId },
      data: { outcome, outcomeNote: outcomeNote ?? null },
      include: { team: true, competition: { select: { id: true, name: true } } },
    });
  },
};
