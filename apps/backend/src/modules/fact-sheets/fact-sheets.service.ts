import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { standingsService } from '@/modules/standings/standings.service';
import type { Competition, CompetitionFormat, CompetitionKind } from '@prisma/client';

/*
  Fichas técnicas. Cada ficha es un objeto plano y auto-descriptivo —titulares,
  tablas y una serie para el gráfico— y no un tipo distinto por entidad: así el
  sitio la dibuja con un solo componente y, sobre todo, la ficha guardada dentro
  de una publicación se sigue pudiendo pintar aunque mañana cambie el cálculo.
*/

export interface SheetFact {
  label: string;
  value: string;
}

export interface SheetHighlight {
  label: string;
  value: string | number;
  hint?: string;
}

export interface SheetTable {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  note?: string;
}

export interface SheetChart {
  title: string;
  labels: string[];
  values: number[];
  unit?: string;
}

export type SheetKind = 'EDITION_SHEET' | 'COMPETITION_SHEET' | 'TEAM_SHEET';

export interface FactSheet {
  kind: SheetKind;
  /** Cuándo se congelaron estos números. */
  generatedAt: string;
  subject: { id: string; name: string; subtitle?: string; imageUrl?: string | null };
  facts: SheetFact[];
  highlights: SheetHighlight[];
  tables: SheetTable[];
  chart?: SheetChart;
}

const FORMAT_LABEL: Record<CompetitionFormat, string> = {
  LEAGUE: 'Liga — todos contra todos',
  GROUPS_KNOCKOUT: 'Grupos + eliminatoria',
};

const KIND_LABEL: Record<CompetitionKind, string> = {
  LEAGUE_DIVISION: 'División de liga',
  CUP: 'Copa',
  YOUTH: 'Juvenil',
  SPECIAL: 'Torneo especial',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'En curso',
  FINISHED: 'Finalizado',
};

/** `DD-MM-YYYY`, que es como se leen las fechas en todo el sitio. */
const shortDate = (d: Date | null | undefined) => {
  if (!d) return '—';
  const [y, m, day] = new Date(d).toISOString().slice(0, 10).split('-');
  return `${day}-${m}-${y}`;
};

const oneDecimal = (n: number) => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');

/**
 * Campeón de una competición. La eliminatoria lo dice sola —es quien ganó la
 * final—; en una liga solo hay campeón cuando el torneo terminó, porque el
 * primero de una tabla a mitad de temporada no es campeón de nada.
 */
const championOf = async (
  competition: Pick<Competition, 'id' | 'format' | 'status'>,
): Promise<{ registrationId: string; teamName: string } | null> => {
  if (competition.format === 'GROUPS_KNOCKOUT') {
    const final = await prisma.knockoutTie.findFirst({
      where: { competitionId: competition.id, stage: 'FINAL' },
      include: { winnerRegistration: { include: { team: true } } },
    });
    const winner = final?.winnerRegistration;
    return winner ? { registrationId: winner.id, teamName: winner.team.name } : null;
  }
  if (competition.status !== 'FINISHED') return null;
  const table = await standingsService.byCompetition(competition.id);
  const first = table[0];
  return first ? { registrationId: first.registrationId, teamName: first.teamName } : null;
};

/** Partidos jugados y goles de un conjunto de competiciones. */
const matchTotals = async (competitionIds: string[]) => {
  if (competitionIds.length === 0) return { played: 0, goals: 0 };
  const agg = await prisma.match.aggregate({
    where: { competitionId: { in: competitionIds }, status: 'FINISHED' },
    _sum: { homeScore: true, awayScore: true },
    _count: { _all: true },
  });
  return {
    played: agg._count._all,
    goals: (agg._sum.homeScore ?? 0) + (agg._sum.awayScore ?? 0),
  };
};

const cardTotals = async (competitionIds: string[]) => {
  if (competitionIds.length === 0) return { yellow: 0, red: 0 };
  const where = { match: { competitionId: { in: competitionIds } } };
  const [yellow, red] = await Promise.all([
    prisma.matchEvent.count({ where: { ...where, type: 'YELLOW' as const } }),
    prisma.matchEvent.count({ where: { ...where, type: 'RED' as const } }),
  ]);
  return { yellow, red };
};

type ScorerFilter = { competitionIds?: string[]; teamId?: string };

const topScorers = async (filter: ScorerFilter, take: number) => {
  const rows = await prisma.playerSeasonStats.findMany({
    where: {
      goals: { gt: 0 },
      rosterEntry: {
        teamRegistration: {
          ...(filter.competitionIds ? { competitionId: { in: filter.competitionIds } } : {}),
          ...(filter.teamId ? { teamId: filter.teamId } : {}),
        },
      },
    },
    include: {
      rosterEntry: {
        include: {
          player: true,
          teamRegistration: {
            include: { team: true, competition: { select: { name: true } } },
          },
        },
      },
    },
    // A igualdad de goles va primero quien los hizo en menos partidos.
    orderBy: [{ goals: 'desc' }, { matchesPlayed: 'asc' }],
    take,
  });
  return rows.map((r) => ({
    name: `${r.rosterEntry.player.firstName} ${r.rosterEntry.player.lastName}`,
    team: r.rosterEntry.teamRegistration.team.name,
    competition: r.rosterEntry.teamRegistration.competition.name,
    matchesPlayed: r.matchesPlayed,
    goals: r.goals,
  }));
};

const competitionSheet = async (competitionId: string): Promise<FactSheet> => {
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: { edition: true, category: true, _count: { select: { registrations: true } } },
  });
  if (!competition) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

  const [standings, totals, cards, champion, scorers] = await Promise.all([
    standingsService.byCompetition(competitionId),
    matchTotals([competitionId]),
    cardTotals([competitionId]),
    championOf(competition),
    topScorers({ competitionIds: [competitionId] }, 10),
  ]);

  const facts: SheetFact[] = [
    { label: 'Edición', value: `${competition.edition.name} · ${competition.edition.year}` },
    { label: 'Categoría', value: competition.category.name },
    { label: 'Formato', value: FORMAT_LABEL[competition.format] },
    { label: 'Tipo', value: KIND_LABEL[competition.kind] },
    { label: 'Estado', value: STATUS_LABEL[competition.status] ?? competition.status },
  ];
  if (competition.division) facts.push({ label: 'División', value: competition.division });
  if (champion) facts.push({ label: 'Campeón', value: champion.teamName });

  return {
    kind: 'COMPETITION_SHEET',
    generatedAt: new Date().toISOString(),
    subject: {
      id: competition.id,
      name: competition.name,
      subtitle: `${competition.category.name} · ${competition.edition.year}`,
      imageUrl: competition.imageUrl,
    },
    facts,
    highlights: [
      { label: 'Equipos', value: competition._count.registrations },
      { label: 'Partidos jugados', value: totals.played },
      { label: 'Goles', value: totals.goals },
      {
        label: 'Goles por partido',
        value: totals.played ? oneDecimal(totals.goals / totals.played) : '—',
      },
      { label: 'Amarillas', value: cards.yellow },
      { label: 'Rojas', value: cards.red },
    ],
    tables: [
      {
        title: competition.format === 'LEAGUE' ? 'Tabla de posiciones' : 'Tabla general',
        columns: ['#', 'Equipo', 'PJ', 'G', 'E', 'P', 'GF', 'GC', 'Pts'],
        rows: standings
          .slice(0, 10)
          .map((r) => [r.position, r.teamName, r.pj, r.g, r.e, r.p, r.gf, r.gc, r.pts]),
        note:
          competition.format === 'GROUPS_KNOCKOUT'
            ? 'Suma de todos los grupos; la eliminatoria se resuelve en el cuadro.'
            : undefined,
      },
      {
        title: 'Goleadores',
        columns: ['#', 'Jugador', 'Equipo', 'PJ', 'Goles'],
        rows: scorers.map((s, i) => [i + 1, s.name, s.team, s.matchesPlayed, s.goals]),
      },
    ],
    chart: {
      title: 'Goles a favor por equipo',
      labels: standings.slice(0, 8).map((r) => r.teamName),
      values: standings.slice(0, 8).map((r) => r.gf),
      unit: 'goles',
    },
  };
};

const editionSheet = async (editionId: string): Promise<FactSheet> => {
  const edition = await prisma.edition.findUnique({
    where: { id: editionId },
    include: {
      competitions: {
        include: { category: true, _count: { select: { registrations: true } } },
        orderBy: [{ divisionLevel: 'asc' }, { name: 'asc' }],
      },
    },
  });
  if (!edition) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

  const compIds = edition.competitions.map((c) => c.id);
  const [totals, cards, players, scorers] = await Promise.all([
    matchTotals(compIds),
    cardTotals(compIds),
    prisma.rosterEntry.count({
      where: { teamRegistration: { competitionId: { in: compIds } }, status: 'ACTIVE' },
    }),
    topScorers({ competitionIds: compIds }, 10),
  ]);

  // Una fila por torneo: cuántos equipos, cuántos partidos y quién lo ganó.
  const perCompetition = await Promise.all(
    edition.competitions.map(async (c) => ({
      competition: c,
      totals: await matchTotals([c.id]),
      champion: await championOf(c),
    })),
  );

  const teams = edition.competitions.reduce((acc, c) => acc + c._count.registrations, 0);

  return {
    kind: 'EDITION_SHEET',
    generatedAt: new Date().toISOString(),
    subject: {
      id: edition.id,
      name: edition.name,
      subtitle: `Temporada ${edition.seasonNumber} · ${edition.year}`,
    },
    facts: [
      { label: 'Año', value: String(edition.year) },
      { label: 'Temporada', value: `N.° ${edition.seasonNumber}` },
      { label: 'Estado', value: STATUS_LABEL[edition.status] ?? edition.status },
      { label: 'Desde', value: shortDate(edition.startDate) },
      { label: 'Hasta', value: shortDate(edition.endDate) },
    ],
    highlights: [
      { label: 'Competiciones', value: edition.competitions.length },
      { label: 'Equipos inscritos', value: teams },
      { label: 'Jugadores', value: players },
      { label: 'Partidos jugados', value: totals.played },
      { label: 'Goles', value: totals.goals },
      {
        label: 'Tarjetas',
        value: cards.yellow + cards.red,
        hint: `${cards.yellow} amarillas · ${cards.red} rojas`,
      },
    ],
    tables: [
      {
        title: 'Competiciones de la edición',
        columns: ['Torneo', 'Categoría', 'Equipos', 'Partidos', 'Campeón'],
        rows: perCompetition.map((p) => [
          p.competition.name,
          p.competition.category.name,
          p.competition._count.registrations,
          p.totals.played,
          p.champion?.teamName ?? '—',
        ]),
        note: 'El campeón aparece cuando el torneo termina o cuando se jugó la final.',
      },
      {
        title: 'Goleadores de la edición',
        columns: ['#', 'Jugador', 'Equipo', 'Torneo', 'Goles'],
        rows: scorers.map((s, i) => [i + 1, s.name, s.team, s.competition, s.goals]),
      },
    ],
    chart: {
      title: 'Goles por competición',
      labels: perCompetition.map((p) => p.competition.name),
      values: perCompetition.map((p) => p.totals.goals),
      unit: 'goles',
    },
  };
};

/**
 * Ficha de un club. Sin año toma toda su historia; con año, solo las ediciones
 * de ese año, que es lo que se publica al cerrar una temporada.
 */
const teamSheet = async (teamId: string, year?: number | null): Promise<FactSheet> => {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

  const registrations = await prisma.teamRegistration.findMany({
    where: {
      teamId,
      ...(year ? { competition: { edition: { year } } } : {}),
    },
    include: { competition: { include: { edition: true, category: true } } },
  });

  // Una sola consulta de tabla por competición, aunque haya varias inscripciones.
  const tables = new Map<string, Awaited<ReturnType<typeof standingsService.byCompetition>>>();
  for (const reg of registrations) {
    if (!tables.has(reg.competitionId)) {
      tables.set(reg.competitionId, await standingsService.byCompetition(reg.competitionId));
    }
  }

  const campaigns = await Promise.all(
    registrations.map(async (reg) => {
      const champion = await championOf(reg.competition);
      return {
        reg,
        row: tables.get(reg.competitionId)?.find((r) => r.registrationId === reg.id),
        title: champion?.registrationId === reg.id,
      };
    }),
  );

  campaigns.sort(
    (a, b) =>
      b.reg.competition.edition.year - a.reg.competition.edition.year ||
      a.reg.competition.name.localeCompare(b.reg.competition.name),
  );

  type Row = NonNullable<(typeof campaigns)[number]['row']>;
  const sum = (pick: (r: Row) => number) =>
    campaigns.reduce((acc, c) => acc + (c.row ? pick(c.row) : 0), 0);

  const years = [...new Set(campaigns.map((c) => c.reg.competition.edition.year))].sort();
  const scorers = await topScorers(
    { teamId, competitionIds: registrations.map((r) => r.competitionId) },
    10,
  );

  const facts: SheetFact[] = [
    { label: 'Club', value: team.name },
    { label: 'Torneos disputados', value: String(campaigns.length) },
  ];
  if (years.length) {
    facts.push({
      label: 'Años',
      value: years.length === 1 ? String(years[0]) : `${years[0]} – ${years[years.length - 1]}`,
    });
  }
  const titles = campaigns.filter((c) => c.title);
  facts.push({
    label: 'Títulos',
    value: titles.length ? titles.map((c) => c.reg.competition.name).join(', ') : 'Todavía ninguno',
  });

  return {
    kind: 'TEAM_SHEET',
    generatedAt: new Date().toISOString(),
    subject: {
      id: team.id,
      name: team.name,
      subtitle: year ? `Temporada ${year}` : 'Historial completo',
      imageUrl: team.logoUrl,
    },
    facts,
    highlights: [
      { label: 'Partidos jugados', value: sum((r) => r.pj) },
      { label: 'Ganados', value: sum((r) => r.g) },
      { label: 'Empatados', value: sum((r) => r.e) },
      { label: 'Perdidos', value: sum((r) => r.p) },
      { label: 'Goles a favor', value: sum((r) => r.gf) },
      { label: 'Goles en contra', value: sum((r) => r.gc) },
    ],
    tables: [
      {
        title: 'Campañas',
        columns: ['Año', 'Torneo', 'PJ', 'G', 'E', 'P', 'GF', 'GC', 'Pts', 'Pos.'],
        rows: campaigns.map((c) => [
          c.reg.competition.edition.year,
          `${c.reg.competition.name}${c.title ? ' 🏆' : ''}`,
          c.row?.pj ?? 0,
          c.row?.g ?? 0,
          c.row?.e ?? 0,
          c.row?.p ?? 0,
          c.row?.gf ?? 0,
          c.row?.gc ?? 0,
          c.row?.pts ?? 0,
          c.row?.position ?? '—',
        ]),
        note: '🏆 marca los torneos que el club ganó.',
      },
      {
        title: 'Máximos goleadores del club',
        columns: ['#', 'Jugador', 'Torneo', 'PJ', 'Goles'],
        rows: scorers.map((s, i) => [i + 1, s.name, s.competition, s.matchesPlayed, s.goals]),
      },
    ],
    chart: {
      title: 'Puntos por torneo',
      labels: campaigns
        .slice(0, 8)
        .map((c) => `${c.reg.competition.edition.year} · ${c.reg.competition.name}`),
      values: campaigns.slice(0, 8).map((c) => c.row?.pts ?? 0),
      unit: 'puntos',
    },
  };
};

export const factSheetsService = {
  /** Arma la ficha que corresponde al tipo de publicación. */
  build: (kind: SheetKind, entityId: string, year?: number | null): Promise<FactSheet> => {
    switch (kind) {
      case 'EDITION_SHEET':
        return editionSheet(entityId);
      case 'COMPETITION_SHEET':
        return competitionSheet(entityId);
      case 'TEAM_SHEET':
        return teamSheet(entityId, year);
    }
  },
  editionSheet,
  competitionSheet,
  teamSheet,
};
