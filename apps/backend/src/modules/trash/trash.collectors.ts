import type { Prisma, TrashKind } from '@prisma/client';

/**
 * Qué se lleva cada borrado.
 *
 * El borrado definitivo (cascade.util) arrastra filas de muchas tablas. Antes de
 * ejecutarlo, estos recolectores fotografían exactamente esas filas para que
 * restaurar pueda reponerlas. Si cambia lo que borra cascade.util, cambia acá.
 */
type Tx = Prisma.TransactionClient;

/** Orden de inserción al restaurar: cada tabla va después de aquellas de las que depende. */
export const RESTORE_ORDER = [
  'edition',
  'leagueSystem',
  'competition',
  'competitionGroup',
  'team',
  'user',
  'player',
  'teamRegistration',
  'knockoutTie',
  'rosterEntry',
  'playerSeasonStats',
  'match',
  'matchEvent',
  'matchAttendance',
  'transfer',
  'teamBlock',
  'advertisement',
  'article',
  'legalPage',
] as const;

export type TrashTable = (typeof RESTORE_ORDER)[number];
export type TrashRow = Record<string, unknown> & { id: string };

/**
 * Vínculos que el borrado dejó en null en filas que sobreviven (llaves del
 * cuadro sin equipo, auditoría sin autor…). Restaurar los vuelve a poner.
 */
export type Relink = { table: string; ids: string[]; data: Record<string, unknown> };

export type Snapshot = {
  rows: Partial<Record<TrashTable, TrashRow[]>>;
  relinks: Relink[];
};

export type Collected = { label: string; detail?: string };

/** Acumulador sin repetidos: un partido puede entrar por su inscripción y por su competición. */
class Bag {
  private tables = new Map<TrashTable, Map<string, TrashRow>>();
  readonly relinks: Relink[] = [];

  add(table: TrashTable, rows: Array<Record<string, unknown>>) {
    const bucket = this.tables.get(table) ?? new Map<string, TrashRow>();
    for (const row of rows) bucket.set(row.id as string, row as TrashRow);
    this.tables.set(table, bucket);
  }

  ids(table: TrashTable) {
    return [...(this.tables.get(table)?.keys() ?? [])];
  }

  snapshot(): Snapshot {
    const rows: Snapshot['rows'] = {};
    for (const table of RESTORE_ORDER) {
      const bucket = this.tables.get(table);
      if (bucket?.size) rows[table] = [...bucket.values()];
    }
    return { rows, relinks: this.relinks };
  }
}

const idsOf = (rows: Array<{ id: string }>) => rows.map((r) => r.id);

/** Inscripciones: partidos, eventos, asistencias, traspasos, plantillas y llaves que las citan. */
const collectRegistrations = async (tx: Tx, bag: Bag, registrationIds: string[]) => {
  if (registrationIds.length === 0) return;

  const matches = await tx.match.findMany({
    where: {
      OR: [
        { homeRegistrationId: { in: registrationIds } },
        { awayRegistrationId: { in: registrationIds } },
      ],
    },
  });
  bag.add('match', matches);

  const roster = await tx.rosterEntry.findMany({
    where: { teamRegistrationId: { in: registrationIds } },
  });
  bag.add('rosterEntry', roster);
  bag.add(
    'playerSeasonStats',
    await tx.playerSeasonStats.findMany({ where: { rosterEntryId: { in: idsOf(roster) } } }),
  );

  bag.add(
    'matchEvent',
    await tx.matchEvent.findMany({
      where: {
        OR: [
          { matchId: { in: idsOf(matches) } },
          { teamRegistrationId: { in: registrationIds } },
        ],
      },
    }),
  );
  // La asistencia se va por cascada de la base, no por cascade.util.
  bag.add(
    'matchAttendance',
    await tx.matchAttendance.findMany({
      where: {
        OR: [{ matchId: { in: idsOf(matches) } }, { rosterEntryId: { in: idsOf(roster) } }],
      },
    }),
  );
  bag.add(
    'transfer',
    await tx.transfer.findMany({
      where: {
        OR: [
          { fromRegistrationId: { in: registrationIds } },
          { toRegistrationId: { in: registrationIds } },
        ],
      },
    }),
  );

  const ties = await tx.knockoutTie.findMany({
    where: {
      OR: [
        { homeRegistrationId: { in: registrationIds } },
        { awayRegistrationId: { in: registrationIds } },
        { winnerRegistrationId: { in: registrationIds } },
      ],
    },
    select: {
      id: true,
      homeRegistrationId: true,
      awayRegistrationId: true,
      winnerRegistrationId: true,
    },
  });
  for (const tie of ties) {
    const data: Record<string, unknown> = {};
    if (tie.homeRegistrationId && registrationIds.includes(tie.homeRegistrationId))
      data.homeRegistrationId = tie.homeRegistrationId;
    if (tie.awayRegistrationId && registrationIds.includes(tie.awayRegistrationId))
      data.awayRegistrationId = tie.awayRegistrationId;
    if (tie.winnerRegistrationId && registrationIds.includes(tie.winnerRegistrationId))
      data.winnerRegistrationId = tie.winnerRegistrationId;
    bag.relinks.push({ table: 'knockoutTie', ids: [tie.id], data });
  }

  bag.add(
    'teamRegistration',
    await tx.teamRegistration.findMany({ where: { id: { in: registrationIds } } }),
  );
};

const collectCompetitions = async (tx: Tx, bag: Bag, competitionIds: string[]) => {
  if (competitionIds.length === 0) return;

  const matches = await tx.match.findMany({ where: { competitionId: { in: competitionIds } } });
  bag.add('match', matches);
  bag.add('matchEvent', await tx.matchEvent.findMany({ where: { matchId: { in: idsOf(matches) } } }));
  bag.add(
    'matchAttendance',
    await tx.matchAttendance.findMany({ where: { matchId: { in: idsOf(matches) } } }),
  );

  const registrations = await tx.teamRegistration.findMany({
    where: { competitionId: { in: competitionIds } },
    select: { id: true },
  });
  await collectRegistrations(tx, bag, idsOf(registrations));

  bag.add('knockoutTie', await tx.knockoutTie.findMany({ where: { competitionId: { in: competitionIds } } }));
  bag.add('teamBlock', await tx.teamBlock.findMany({ where: { competitionId: { in: competitionIds } } }));
  bag.add(
    'competitionGroup',
    await tx.competitionGroup.findMany({ where: { competitionId: { in: competitionIds } } }),
  );
  bag.add('competition', await tx.competition.findMany({ where: { id: { in: competitionIds } } }));

  // Las fichas de noticias sobreviven, solo pierden el enlace (onDelete: SetNull).
  const articles = await tx.article.findMany({
    where: { competitionId: { in: competitionIds } },
    select: { id: true, competitionId: true },
  });
  for (const a of articles) {
    bag.relinks.push({ table: 'article', ids: [a.id], data: { competitionId: a.competitionId } });
  }
};

const collectUser = async (tx: Tx, bag: Bag, userId: string) => {
  bag.add('user', await tx.user.findMany({ where: { id: userId } }));

  const logs = await tx.auditLog.findMany({ where: { userId }, select: { id: true } });
  if (logs.length) bag.relinks.push({ table: 'auditLog', ids: idsOf(logs), data: { userId } });

  const issued = await tx.teamBlock.findMany({ where: { blockedById: userId }, select: { id: true } });
  if (issued.length) bag.relinks.push({ table: 'teamBlock', ids: idsOf(issued), data: { blockedById: userId } });

  const lifted = await tx.teamBlock.findMany({ where: { liftedById: userId }, select: { id: true } });
  if (lifted.length) bag.relinks.push({ table: 'teamBlock', ids: idsOf(lifted), data: { liftedById: userId } });

  const articles = await tx.article.findMany({ where: { authorId: userId }, select: { id: true } });
  if (articles.length) bag.relinks.push({ table: 'article', ids: idsOf(articles), data: { authorId: userId } });
};

type Collector = (tx: Tx, bag: Bag, id: string) => Promise<Collected | null>;

const matchLabel = async (tx: Tx, matchId: string) => {
  const m = await tx.match.findUnique({
    where: { id: matchId },
    include: {
      competition: { select: { name: true } },
      homeRegistration: { select: { team: { select: { name: true } } } },
      awayRegistration: { select: { team: { select: { name: true } } } },
    },
  });
  if (!m) return null;
  return {
    label: `${m.homeRegistration.team.name} vs ${m.awayRegistration.team.name}`,
    detail: `${m.competition.name} · jornada ${m.matchday}`,
  };
};

export const COLLECTORS: Record<TrashKind, Collector> = {
  EDITION: async (tx, bag, id) => {
    const edition = await tx.edition.findUnique({ where: { id } });
    if (!edition) return null;

    const competitions = await tx.competition.findMany({ where: { editionId: id }, select: { id: true } });
    await collectCompetitions(tx, bag, idsOf(competitions));
    bag.add('transfer', await tx.transfer.findMany({ where: { editionId: id } }));
    bag.add('leagueSystem', await tx.leagueSystem.findMany({ where: { editionId: id } }));
    bag.add('edition', [edition]);

    const articles = await tx.article.findMany({ where: { editionId: id }, select: { id: true } });
    if (articles.length) bag.relinks.push({ table: 'article', ids: idsOf(articles), data: { editionId: id } });

    return { label: edition.name, detail: `Temporada ${edition.seasonNumber} · ${edition.year}` };
  },

  COMPETITION: async (tx, bag, id) => {
    const competition = await tx.competition.findUnique({
      where: { id },
      include: { edition: { select: { name: true } } },
    });
    if (!competition) return null;
    await collectCompetitions(tx, bag, [id]);
    return { label: competition.name, detail: competition.edition.name };
  },

  TEAM: async (tx, bag, id) => {
    const found = await tx.team.findUnique({ where: { id }, include: { leader: true } });
    if (!found) return null;
    const { leader, ...team } = found;

    const registrations = await tx.teamRegistration.findMany({ where: { teamId: id }, select: { id: true } });
    await collectRegistrations(tx, bag, idsOf(registrations));
    bag.add('teamBlock', await tx.teamBlock.findMany({ where: { teamId: id } }));
    if (leader) await collectUser(tx, bag, leader.id);
    bag.add('team', [team]);

    const articles = await tx.article.findMany({ where: { teamId: id }, select: { id: true } });
    if (articles.length) bag.relinks.push({ table: 'article', ids: idsOf(articles), data: { teamId: id } });

    return { label: team.name, detail: leader ? `Delegado: ${leader.username}` : undefined };
  },

  PLAYER: async (tx, bag, id) => {
    const player = await tx.player.findUnique({ where: { id } });
    if (!player) return null;

    bag.add('matchEvent', await tx.matchEvent.findMany({ where: { playerId: id } }));
    bag.add('transfer', await tx.transfer.findMany({ where: { playerId: id } }));

    const mvps = await tx.match.findMany({ where: { mvpPlayerId: id }, select: { id: true } });
    if (mvps.length) bag.relinks.push({ table: 'match', ids: idsOf(mvps), data: { mvpPlayerId: id } });

    const roster = await tx.rosterEntry.findMany({ where: { playerId: id } });
    bag.add('rosterEntry', roster);
    bag.add(
      'playerSeasonStats',
      await tx.playerSeasonStats.findMany({ where: { rosterEntryId: { in: idsOf(roster) } } }),
    );
    bag.add(
      'matchAttendance',
      await tx.matchAttendance.findMany({ where: { rosterEntryId: { in: idsOf(roster) } } }),
    );
    bag.add('player', [player]);

    return {
      label: `${player.firstName} ${player.lastName}`,
      detail: `${player.documentType} ${player.documentNumber}`,
    };
  },

  USER: async (tx, bag, id) => {
    const user = await tx.user.findUnique({ where: { id } });
    if (!user) return null;
    await collectUser(tx, bag, id);
    return { label: user.username, detail: user.email ?? user.role };
  },

  MATCH: async (tx, bag, id) => {
    const match = await tx.match.findUnique({ where: { id } });
    if (!match) return null;
    const described = await matchLabel(tx, id);
    bag.add('matchEvent', await tx.matchEvent.findMany({ where: { matchId: id } }));
    bag.add('matchAttendance', await tx.matchAttendance.findMany({ where: { matchId: id } }));
    bag.add('match', [match]);
    return described;
  },

  MATCH_EVENT: async (tx, bag, id) => {
    const event = await tx.matchEvent.findUnique({
      where: { id },
      include: { player: { select: { firstName: true, lastName: true } } },
    });
    if (!event) return null;
    const { player, ...row } = event;
    bag.add('matchEvent', [row]);
    const match = await matchLabel(tx, event.matchId);
    return {
      label: `${event.type} · min ${event.minute}${player ? ` · ${player.firstName} ${player.lastName}` : ''}`,
      detail: match ? match.label : undefined,
    };
  },

  AD: async (tx, bag, id) => {
    const ad = await tx.advertisement.findUnique({ where: { id } });
    if (!ad) return null;
    bag.add('advertisement', [ad]);
    return { label: ad.title || 'Anuncio sin nombre', detail: ad.placements.join(', ') || undefined };
  },

  ARTICLE: async (tx, bag, id) => {
    const article = await tx.article.findUnique({ where: { id } });
    if (!article) return null;
    bag.add('article', [article]);
    return { label: article.title, detail: article.kind };
  },

  LEGAL_PAGE: async (tx, bag, id) => {
    const page = await tx.legalPage.findUnique({ where: { id } });
    if (!page) return null;
    bag.add('legalPage', [page]);
    return { label: page.title, detail: `/legal/${page.slug}` };
  },
};

export const createBag = () => new Bag();
export type { Bag };
