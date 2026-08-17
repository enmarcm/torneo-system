import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { assertDeletable } from '@/utils/deletion.util';
import { Prisma, type CompetitionKind } from '@prisma/client';
import type { CreateCompetitionDto } from './competitions.schema';

/**
 * Devuelve el sistema de liga de una edición, creándolo si todavía no existe.
 *
 * Cada edición tiene una sola liga, y es la que entrelaza a Primera, Segunda y
 * Tercera entre sí: sin ese vínculo el ascenso y el descenso no tienen contra
 * qué operar, y la Copa no sabe de dónde salen sus equipos. Se resuelve solo
 * para que el administrador no tenga que mantenerlo a mano.
 */
const ensureLeagueSystem = async (editionId: string) => {
  const existing = await prisma.leagueSystem.findFirst({ where: { editionId } });
  if (existing) return existing;
  const edition = await prisma.edition.findUnique({ where: { id: editionId } });
  if (!edition) throw new AppError(404, 'Edición no encontrada', 'NOT_FOUND');
  return prisma.leagueSystem.create({
    data: { editionId, name: `Liga ${edition.name}` },
  });
};

/**
 * Resuelve a qué liga se engancha la competición según su tipo:
 * una división pertenece a la liga de su edición, y una copa se nutre de ella.
 */
const resolveLeagueLinks = async (
  editionId: string,
  kind: CompetitionKind,
  explicit: { leagueSystemId?: string | null; sourceLeagueSystemId?: string | null },
) => {
  if (explicit.leagueSystemId || explicit.sourceLeagueSystemId) {
    return {
      leagueSystemId: explicit.leagueSystemId ?? null,
      sourceLeagueSystemId: explicit.sourceLeagueSystemId ?? null,
    };
  }
  if (kind === 'LEAGUE_DIVISION') {
    const system = await ensureLeagueSystem(editionId);
    return { leagueSystemId: system.id, sourceLeagueSystemId: null };
  }
  if (kind === 'CUP') {
    const system = await ensureLeagueSystem(editionId);
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

export const competitionsService = {
  list: (editionId?: string) =>
    prisma.competition.findMany({
      where: editionId ? { editionId } : {},
      include: { category: true, _count: { select: { registrations: true, matches: true } } },
      orderBy: { createdAt: 'desc' },
    }),

  get: async (id: string) => {
    const c = await prisma.competition.findUnique({
      where: { id },
      include: {
        category: true,
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
    const cat = await prisma.category.findUnique({ where: { id: d.categoryId } });
    if (!cat) throw new AppError(404, 'Categoría no encontrada', 'NOT_FOUND');

    const kind = d.kind ?? cat.defaultKind;
    const divisionLevel = d.divisionLevel ?? cat.defaultDivisionLevel;
    const links = await resolveLeagueLinks(d.editionId, kind, {
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
        categoryId: d.categoryId,
        name: d.name ?? cat.name,
        format: d.format ?? cat.defaultFormat,
        kind,
        imageUrl: d.imageUrl ?? cat.imageUrl,
        division: d.division ?? null,
        divisionLevel,
        leagueSystemId: links.leagueSystemId,
        sourceLeagueSystemId: links.sourceLeagueSystemId,
        rounds: d.rounds ?? 1,
        twoLeggedStages: knockout ? knockout.twoLeggedStages : (d.twoLeggedStages ?? []),
        promotionSpots: d.promotionSpots ?? 0,
        relegationSpots: d.relegationSpots ?? 0,
        ageMin: d.ageMin ?? cat.defaultAgeMin,
        ageMax: d.ageMax ?? cat.defaultAgeMax,
        requiresAdminEligibility: d.requiresAdminEligibility ?? cat.defaultRequiresAdminEligibility,
        minPlayers: d.minPlayers ?? cat.defaultMinPlayers,
        maxPlayers: d.maxPlayers ?? cat.defaultMaxPlayers,
        manualTeamSelection: d.manualTeamSelection ?? cat.defaultFormat === 'GROUPS_KNOCKOUT',
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

    const kind = data.kind ?? current.kind;
    const divisionLevel =
      data.divisionLevel !== undefined ? data.divisionLevel : current.divisionLevel;

    // Si cambió el tipo de torneo hay que recalcular el vínculo con la liga:
    // una competición que deja de ser división no debe seguir colgada de ella.
    const links =
      kind !== current.kind || (!current.leagueSystemId && !current.sourceLeagueSystemId)
        ? await resolveLeagueLinks(current.editionId, kind, {
            leagueSystemId: data.leagueSystemId,
            sourceLeagueSystemId: data.sourceLeagueSystemId,
          })
        : {
            leagueSystemId: data.leagueSystemId ?? current.leagueSystemId,
            sourceLeagueSystemId: data.sourceLeagueSystemId ?? current.sourceLeagueSystemId,
          };

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
        divisionLevel,
        ...links,
        ...(knockout ?? {}),
      },
    });
  },

  setStatus: (id: string, status: 'DRAFT' | 'ACTIVE' | 'FINISHED') =>
    prisma.competition.update({ where: { id }, data: { status } }),

  /**
   * Borrado definitivo. Solo si no tiene equipos inscritos ni partidos: con
   * partidos jugados, borrarla destruye la tabla y las estadísticas de la
   * temporada. Los grupos y el cuadro vacíos sí se van con ella.
   */
  remove: async (id: string) => {
    const competition = await prisma.competition.findUnique({ where: { id } });
    if (!competition) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

    const [registrations, matches] = await Promise.all([
      prisma.teamRegistration.count({ where: { competitionId: id } }),
      prisma.match.count({ where: { competitionId: id } }),
    ]);
    assertDeletable('la competición', [
      { label: 'equipos inscritos', count: registrations },
      { label: 'partidos', count: matches },
    ]);

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.knockoutTie.deleteMany({ where: { competitionId: id } });
      await tx.competitionGroup.deleteMany({ where: { competitionId: id } });
      await tx.competition.delete({ where: { id } });
      return { id };
    });
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
    const reg = await prisma.teamRegistration.findUnique({ where: { id: registrationId } });
    if (!reg) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return prisma.teamRegistration.update({
      where: { id: registrationId },
      data: { outcome, outcomeNote: outcomeNote ?? null },
      include: { team: true, competition: { select: { id: true, name: true } } },
    });
  },
};
