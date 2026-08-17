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

type MiniRow = { pts: number; dg: number; gf: number };
type PlayedMatch = {
  homeRegistrationId: string;
  awayRegistrationId: string;
  homeScore: number;
  awayScore: number;
};

/**
 * Mini-tabla construida SOLO con los partidos jugados entre los equipos empatados.
 * Es el criterio de "enfrentamiento directo" que va justo después de los puntos.
 */
const headToHead = (ids: string[], matches: PlayedMatch[]): Record<string, MiniRow> => {
  const tied = new Set(ids);
  const mini: Record<string, MiniRow> = {};
  for (const id of ids) mini[id] = { pts: 0, dg: 0, gf: 0 };

  for (const m of matches) {
    if (!tied.has(m.homeRegistrationId) || !tied.has(m.awayRegistrationId)) continue;
    const home = mini[m.homeRegistrationId];
    const away = mini[m.awayRegistrationId];
    home.gf += m.homeScore;
    away.gf += m.awayScore;
    home.dg += m.homeScore - m.awayScore;
    away.dg += m.awayScore - m.homeScore;
    if (m.homeScore > m.awayScore) home.pts += 3;
    else if (m.homeScore < m.awayScore) away.pts += 3;
    else {
      home.pts += 1;
      away.pts += 1;
    }
  }
  return mini;
};

/**
 * Ordena la tabla: Pts → enfrentamiento directo → DG → GF.
 * El enfrentamiento directo solo se aplica dentro de cada bloque de equipos
 * igualados en puntos; si siguen empatados ahí, se cae a DG y GF generales.
 */
const sortRows = (rows: Row[], matches: PlayedMatch[]): Row[] => {
  const byPoints = [...rows].sort((a, b) => b.pts - a.pts);
  const out: Row[] = [];

  let i = 0;
  while (i < byPoints.length) {
    let j = i + 1;
    while (j < byPoints.length && byPoints[j].pts === byPoints[i].pts) j++;
    const block = byPoints.slice(i, j);

    if (block.length > 1) {
      const mini = headToHead(
        block.map((r) => r.registrationId),
        matches,
      );
      block.sort((a, b) => {
        const ma = mini[a.registrationId];
        const mb = mini[b.registrationId];
        return (
          mb.pts - ma.pts ||
          mb.dg - ma.dg ||
          mb.gf - ma.gf ||
          b.dg - a.dg ||
          b.gf - a.gf ||
          a.teamName.localeCompare(b.teamName)
        );
      });
    }

    out.push(...block);
    i = j;
  }
  return out;
};

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

    const withDg = Object.values(table).map((r) => ({ ...r, dg: r.gf - r.gc }));
    const rows = sortRows(withDg, matches);

    // Zonas: primero las plazas configuradas por el admin, luego los clasificados a
    // eliminatoria. La decisión final de ascenso/descenso la marca el admin en cada
    // inscripción (outcome) y tiene prioridad sobre la zona calculada.
    const outcomeByReg = new Map(regs.map((r) => [r.id, r.outcome]));
    const promotion = competition?.promotionSpots ?? 0;
    const relegation = competition?.relegationSpots ?? 0;
    const qualifiers = competition?.knockoutQualifiers ?? null;
    const total = rows.length;

    return rows.map((r, i) => {
      let zone: 'PROMOTION' | 'QUALIFY' | 'RELEGATION' | 'NORMAL' = 'NORMAL';
      if (promotion > 0 && i < promotion) zone = 'PROMOTION';
      else if (qualifiers && i < qualifiers) zone = 'QUALIFY';
      else if (relegation > 0 && i >= total - relegation) zone = 'RELEGATION';

      return {
        ...r,
        position: i + 1,
        zone,
        outcome: outcomeByReg.get(r.registrationId) ?? 'NONE',
      };
    });
  },
};
