import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import type { HistoryFilters } from './history.schema';

const scopedRegistrations = (f: HistoryFilters) => Prisma.sql`
  SELECT tr.* FROM "TeamRegistration" tr
  JOIN "Competition" c ON c.id = tr."competitionId"
  JOIN "Edition" e ON e.id = c."editionId"
  WHERE TRUE
  ${f.year ? Prisma.sql`AND e.year = ${f.year}` : Prisma.empty}
  ${f.editionId ? Prisma.sql`AND e.id = ${f.editionId}` : Prisma.empty}
  ${f.competitionId ? Prisma.sql`AND c.id = ${f.competitionId}` : Prisma.empty}
  ${f.teamId ? Prisma.sql`AND tr."teamId" = ${f.teamId}` : Prisma.empty}
  ${f.ageGroup ? Prisma.sql`AND c."ageGroup"::text = ${f.ageGroup}` : Prisma.empty}`;

const hasScope = (f: HistoryFilters) => !!(f.year || f.editionId || f.competitionId || f.teamId || f.ageGroup);
const zeroStats = () => ({ matchesPlayed: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0 });
type Stats = ReturnType<typeof zeroStats>;
const sumStats = (rows: { stats: Stats | null }[]) => rows.reduce((total, row) => {
  for (const key of Object.keys(total) as (keyof Stats)[]) total[key] += row.stats?.[key] ?? 0;
  return total;
}, zeroStats());

const competitionFilter = (f: HistoryFilters): Prisma.CompetitionWhereInput => ({
  ...(f.competitionId ? { id: f.competitionId } : {}),
  ...(f.editionId ? { editionId: f.editionId } : {}),
  ...(f.year ? { edition: { year: f.year } } : {}),
  ...(f.ageGroup ? { ageGroup: f.ageGroup } : {}),
});
const registrationFilter = (f: HistoryFilters): Prisma.TeamRegistrationWhereInput => ({
  ...(f.teamId ? { teamId: f.teamId } : {}), competition: competitionFilter(f),
});
const competitionSelect = {
  id: true, name: true, ageGroup: true, kind: true, status: true, editionId: true, maxPlayers: true,
  edition: { select: { id: true, name: true, year: true, status: true } },
} satisfies Prisma.CompetitionSelect;
const matchInclude = {
  competition: { select: competitionSelect },
  homeRegistration: { select: { id: true, team: { select: { id: true, name: true, logoUrl: true } } } },
  awayRegistration: { select: { id: true, team: { select: { id: true, name: true, logoUrl: true } } } },
} satisfies Prisma.MatchInclude;

export const summarizeTeamMatches = (registrationId: string, matches: { homeRegistrationId: string; awayRegistrationId: string; homeScore: number; awayScore: number }[]) => {
  const totals = { matchesPlayed: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
  for (const match of matches) {
    if (match.homeRegistrationId !== registrationId && match.awayRegistrationId !== registrationId) continue;
    const home = match.homeRegistrationId === registrationId;
    const gf = home ? match.homeScore : match.awayScore, ga = home ? match.awayScore : match.homeScore;
    totals.matchesPlayed++; totals.goalsFor += gf; totals.goalsAgainst += ga;
    if (gf > ga) totals.wins++; else if (gf === ga) totals.draws++; else totals.losses++;
  }
  return totals;
};

// The aggregate is computed over the complete filtered history in PostgreSQL,
// before pagination. Inactive profiles, registrations and rosters are included.
export const historyService = {
  report: async (kind: 'players' | 'teams', f: HistoryFilters) => {
    const scope = scopedRegistrations(f);
    const playerRows = Prisma.sql`
      WITH scoped AS (${scope}), rows AS (
      SELECT p.id, CONCAT(p."firstName", ' ', p."lastName") AS name, p.status,
        p."photoUrl", p."documentNumber", COUNT(DISTINCT tr."teamId")::int AS teams,
        COUNT(DISTINCT tr."competitionId")::int AS tournaments,
        COALESCE(SUM(s."matchesPlayed"),0)::int AS "matchesPlayed",
        COALESCE(SUM(s.goals),0)::int AS goals, COALESCE(SUM(s.assists),0)::int AS assists,
        COALESCE(SUM(s."yellowCards"),0)::int AS "yellowCards", COALESCE(SUM(s."redCards"),0)::int AS "redCards"
      FROM "Player" p
      LEFT JOIN "RosterEntry" r ON r."playerId" = p.id AND r."teamRegistrationId" IN (SELECT id FROM scoped)
      LEFT JOIN scoped tr ON tr.id = r."teamRegistrationId"
      LEFT JOIN "PlayerSeasonStats" s ON s."rosterEntryId" = r.id
      WHERE TRUE
      ${f.q ? Prisma.sql`AND (CONCAT(p."firstName", ' ', p."lastName") ILIKE ${`%${f.q}%`} OR p."documentNumber" ILIKE ${`%${f.q}%`})` : Prisma.empty}
      ${f.status ? Prisma.sql`AND p.status::text = ${f.status}` : Prisma.empty}
      ${hasScope(f) ? Prisma.sql`AND tr.id IS NOT NULL` : Prisma.empty}
      GROUP BY p.id)`;
    const teamRows = Prisma.sql`
      WITH scoped AS (${scope}), played AS (
        SELECT tr."teamId", m.id, m."homeScore" AS gf, m."awayScore" AS ga FROM scoped tr
        JOIN "Match" m ON m."homeRegistrationId" = tr.id WHERE m.status = 'FINISHED'
        UNION ALL
        SELECT tr."teamId", m.id, m."awayScore" AS gf, m."homeScore" AS ga FROM scoped tr
        JOIN "Match" m ON m."awayRegistrationId" = tr.id WHERE m.status = 'FINISHED'
      ), results AS (
        SELECT "teamId", COUNT(*)::int AS "matchesPlayed", SUM(gf)::int AS goals, SUM(ga)::int AS "goalsAgainst",
          COUNT(*) FILTER (WHERE gf > ga)::int AS wins, COUNT(*) FILTER (WHERE gf = ga)::int AS draws,
          COUNT(*) FILTER (WHERE gf < ga)::int AS losses FROM played GROUP BY "teamId"
      ), rows AS (
        SELECT t.id, t.name, t.status, t."logoUrl", COUNT(DISTINCT tr."competitionId")::int AS tournaments,
          COUNT(DISTINCT r."playerId")::int AS players, COALESCE(MAX(a."matchesPlayed"),0)::int AS "matchesPlayed",
          COALESCE(MAX(a.goals),0)::int AS goals, COALESCE(MAX(a."goalsAgainst"),0)::int AS "goalsAgainst",
          COALESCE(MAX(a.wins),0)::int AS wins, COALESCE(MAX(a.draws),0)::int AS draws, COALESCE(MAX(a.losses),0)::int AS losses
        FROM "Team" t LEFT JOIN scoped tr ON tr."teamId" = t.id
        LEFT JOIN "RosterEntry" r ON r."teamRegistrationId" = tr.id LEFT JOIN results a ON a."teamId" = t.id
        WHERE TRUE
        ${f.q ? Prisma.sql`AND t.name ILIKE ${`%${f.q}%`}` : Prisma.empty}
        ${f.status ? Prisma.sql`AND t.status::text = ${f.status}` : Prisma.empty}
        ${hasScope(f) ? Prisma.sql`AND tr.id IS NOT NULL` : Prisma.empty}
        GROUP BY t.id)`;
    const cte = kind === 'players' ? playerRows : teamRows;
    const order = f.sort === 'name' ? Prisma.sql`name ASC, id ASC`
      : f.sort === 'matches' ? Prisma.sql`"matchesPlayed" DESC, name ASC, id ASC`
        : f.sort === 'tournaments' ? Prisma.sql`tournaments DESC, name ASC, id ASC`
          : Prisma.sql`goals DESC, "matchesPlayed" DESC, name ASC, id ASC`;
    return prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<any[]>(Prisma.sql`${cte} SELECT * FROM rows ORDER BY ${order} LIMIT ${f.limit} OFFSET ${(f.page - 1) * f.limit}`);
      const [summary] = await tx.$queryRaw<{ total: number; goals: number; matchesPlayed: number }[]>(Prisma.sql`${cte}
        SELECT COUNT(*)::int AS total, COALESCE(SUM(goals),0)::int AS goals,
          COALESCE(SUM("matchesPlayed"),0)::int AS "matchesPlayed" FROM rows`);
      return { rows, summary, total: summary.total, page: f.page, limit: f.limit };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  },

  player: async (id: string, f: HistoryFilters) => prisma.$transaction(async (tx) => {
    const player = await tx.player.findUnique({ where: { id }, select: {
      id: true, firstName: true, lastName: true, birthDate: true, documentType: true, documentNumber: true,
      photoUrl: true, position: true, status: true, createdAt: true, universityDegreeVerified: true,
    } });
    if (!player) throw new AppError(404, 'Jugador no encontrado', 'NOT_FOUND');
    const career = await tx.rosterEntry.findMany({
      where: { playerId: id, teamRegistration: registrationFilter(f) },
      include: { stats: true, teamRegistration: { select: {
        id: true, status: true, outcome: true, team: { select: { id: true, name: true, logoUrl: true } },
        competition: { select: competitionSelect },
      } } }, orderBy: [{ teamRegistration: { competition: { edition: { year: 'desc' } } } }, { createdAt: 'desc' }],
    });
    const regIds = career.map((entry) => entry.teamRegistrationId);
    const where: Prisma.MatchWhereInput = {
      competition: competitionFilter(f),
      OR: [
        { attendances: { some: { rosterEntry: { playerId: id, teamRegistrationId: { in: regIds } } } } },
        { events: { some: { playerId: id, teamRegistrationId: { in: regIds } } } },
      ],
    };
    const matches = await tx.match.findMany({
      where, include: { ...matchInclude,
        events: { where: { playerId: id, teamRegistrationId: { in: regIds } } },
        attendances: { where: { rosterEntry: { playerId: id, teamRegistrationId: { in: regIds } } }, select: { present: true } },
      }, orderBy: [{ scheduledAt: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }], skip: (f.page - 1) * f.limit, take: f.limit,
    });
    const totalMatches = await tx.match.count({ where });
    const transfers = await tx.transfer.findMany({ where: { playerId: id, toRegistration: registrationFilter(f) },
      select: { id: true, status: true, createdAt: true, edition: { select: { name: true, year: true } },
        fromRegistration: { select: { team: { select: { id: true, name: true } } } },
        toRegistration: { select: { team: { select: { id: true, name: true } }, competition: { select: { name: true } } } },
      }, orderBy: { createdAt: 'desc' } });
    return { player, career, totals: sumStats(career), teams: new Set(career.map((r) => r.teamRegistration.team.id)).size,
      tournaments: new Set(career.map((r) => r.teamRegistration.competition.id)).size, matches, totalMatches, transfers, page: f.page, limit: f.limit };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }),

  team: async (id: string, f: HistoryFilters) => prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({ where: { id }, select: { id: true, name: true, logoUrl: true, status: true, createdAt: true, leader: { select: { username: true } } } });
    if (!team) throw new AppError(404, 'Equipo no encontrado', 'NOT_FOUND');
    const registrations = await tx.teamRegistration.findMany({
      where: { teamId: id, competition: competitionFilter(f) },
      include: { competition: { select: competitionSelect }, roster: { include: {
        player: { select: { id: true, firstName: true, lastName: true, photoUrl: true, status: true } }, stats: true,
      } } }, orderBy: [{ competition: { edition: { year: 'desc' } } }, { createdAt: 'desc' }],
    });
    const ids = registrations.map((r) => r.id);
    const where: Prisma.MatchWhereInput = { OR: [{ homeRegistrationId: { in: ids } }, { awayRegistrationId: { in: ids } }] };
    const finished = await tx.match.findMany({ where: { ...where, status: 'FINISHED' }, select: { id: true, homeRegistrationId: true, awayRegistrationId: true, homeScore: true, awayScore: true } });
    const career = registrations.map((r) => ({ ...r, totals: summarizeTeamMatches(r.id, finished) }));
    const totals = career.reduce((sum, r) => {
      for (const key of Object.keys(sum) as (keyof typeof sum)[]) sum[key] += r.totals[key];
      return sum;
    }, summarizeTeamMatches('', []));
    const matches = await tx.match.findMany({ where, include: matchInclude,
      orderBy: [{ scheduledAt: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }], skip: (f.page - 1) * f.limit, take: f.limit });
    return { team, career, totals, players: new Set(registrations.flatMap((r) => r.roster.map((e) => e.playerId))).size,
      matches, totalMatches: await tx.match.count({ where }), page: f.page, limit: f.limit };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }),
};
