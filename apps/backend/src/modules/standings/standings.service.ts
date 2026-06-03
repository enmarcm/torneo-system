import { prisma } from '@/lib/prisma';

interface Row {
  registrationId: string;
  teamName: string;
  logoUrl: string | null;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
}

export const standingsService = {
  byCompetition: async (competitionId: string, groupId?: string) => {
    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    const regs = await prisma.teamRegistration.findMany({
      where: {
        competitionId,
        status: 'ACTIVE',
        ...(groupId ? { groupId } : {}),
      },
      include: { team: true },
    });
    const matches = await prisma.match.findMany({
      where: {
        competitionId,
        status: 'FINISHED',
        ...(groupId ? { groupId } : {}),
      },
    });

    const table: Record<string, Row> = {};
    for (const r of regs) {
      table[r.id] = {
        registrationId: r.id,
        teamName: r.team.name,
        logoUrl: r.team.logoUrl,
        pj: 0,
        g: 0,
        e: 0,
        p: 0,
        gf: 0,
        gc: 0,
        dg: 0,
        pts: 0,
      };
    }

    for (const m of matches) {
      const home = table[m.homeRegistrationId];
      const away = table[m.awayRegistrationId];
      if (!home || !away) continue;
      home.pj += 1;
      away.pj += 1;
      home.gf += m.homeScore;
      home.gc += m.awayScore;
      away.gf += m.awayScore;
      away.gc += m.homeScore;
      if (m.homeScore > m.awayScore) {
        home.g += 1;
        home.pts += 3;
        away.p += 1;
      } else if (m.homeScore < m.awayScore) {
        away.g += 1;
        away.pts += 3;
        home.p += 1;
      } else {
        home.e += 1;
        away.e += 1;
        home.pts += 1;
        away.pts += 1;
      }
    }

    const rows = Object.values(table).map((r) => ({ ...r, dg: r.gf - r.gc }));
    rows.sort(
      (a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf,
    );

    const qualifiers = competition?.knockoutQualifiers ?? null;
    const total = rows.length;
    return rows.map((r, i) => ({
      ...r,
      position: i + 1,
      zone:
        qualifiers && i < qualifiers
          ? 'QUALIFY'
          : i === total - 1 && total > 4
            ? 'RELEGATION'
            : 'NORMAL',
    }));
  },
};
