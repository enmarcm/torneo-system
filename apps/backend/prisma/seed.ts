import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

/**
 * Estructura real del torneo:
 *  - La liga son tres divisiones ligadas entre sí (Primera → Segunda → Tercera),
 *    con ascenso y descenso que decide el administrador.
 *  - La Copa de la Liga se nutre de esas tres divisiones: grupos de 4 y luego
 *    eliminatoria desde octavos a ida y vuelta.
 *  - Las menores (Sub-X), el Gremial y el Veterano son torneos independientes.
 */
const CATEGORIES: Prisma.CategoryCreateInput[] = [
  {
    name: 'Sub-12',
    defaultKind: 'YOUTH',
    defaultAgeMin: 0,
    defaultAgeMax: 12,
    defaultMinPlayers: 7,
    defaultMaxPlayers: 20,
  },
  {
    name: 'Sub-15',
    defaultKind: 'YOUTH',
    defaultAgeMin: 13,
    defaultAgeMax: 15,
    defaultMinPlayers: 7,
    defaultMaxPlayers: 20,
  },
  {
    name: 'Sub-17',
    defaultKind: 'YOUTH',
    defaultAgeMin: 16,
    defaultAgeMax: 17,
    defaultMinPlayers: 7,
    defaultMaxPlayers: 22,
  },
  { name: 'Primera División', defaultKind: 'LEAGUE_DIVISION', defaultDivisionLevel: 1, defaultAgeMin: 18 },
  { name: 'Segunda División', defaultKind: 'LEAGUE_DIVISION', defaultDivisionLevel: 2, defaultAgeMin: 18 },
  { name: 'Tercera División', defaultKind: 'LEAGUE_DIVISION', defaultDivisionLevel: 3, defaultAgeMin: 18 },
  { name: 'Gremial', defaultKind: 'SPECIAL', defaultAgeMin: 18, defaultRequiresAdminEligibility: true },
  { name: 'Veterano', defaultKind: 'SPECIAL', defaultAgeMin: 35, defaultRequiresAdminEligibility: true },
  {
    name: 'Copa de la Liga',
    defaultKind: 'CUP',
    defaultFormat: 'GROUPS_KNOCKOUT',
  },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@torneo.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234';
  const adminHash = await argon2.hash(adminPassword);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, role: 'ADMIN', status: 'ACTIVE' },
    create: { email: adminEmail, passwordHash: adminHash, role: 'ADMIN', status: 'ACTIVE' },
  });

  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
  }

  const existingEdition = await prisma.edition.findFirst({ where: { name: 'Apertura 2026' } });
  if (existingEdition) {
    console.log('✅ Seed ya ejecutado (edición Apertura 2026 existe).');
    return;
  }

  const edition = await prisma.edition.create({
    data: {
      name: 'Apertura 2026',
      year: 2026,
      seasonNumber: 1,
      status: 'ACTIVE',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-04-15'),
      transfersOpen: true,
    },
  });

  const primera = await prisma.category.findUnique({ where: { name: 'Primera División' } });
  if (!primera) throw new Error('No se encontró categoría Primera División');

  // Sistema de liga: agrupa las divisiones para el ascenso/descenso y le dice a
  // la Copa de dónde salen sus equipos.
  const leagueSystem = await prisma.leagueSystem.create({
    data: { editionId: edition.id, name: `Liga ${edition.name}` },
  });

  const comp = await prisma.competition.create({
    data: {
      editionId: edition.id,
      categoryId: primera.id,
      name: 'Primera División',
      format: 'LEAGUE',
      kind: 'LEAGUE_DIVISION',
      leagueSystemId: leagueSystem.id,
      divisionLevel: 1,
      rounds: 2,
      relegationSpots: 2,
      ageMin: 18,
      minPlayers: 11,
      maxPlayers: 25,
      knockoutQualifiers: 8,
      status: 'ACTIVE',
    },
  });

  // Copa de la Liga: 8 grupos de 4 → octavos, cuartos y semis a ida y vuelta,
  // final a partido único.
  const copaCat = await prisma.category.findUnique({ where: { name: 'Copa de la Liga' } });
  if (copaCat) {
    await prisma.competition.create({
      data: {
        editionId: edition.id,
        categoryId: copaCat.id,
        name: 'Copa de la Liga',
        format: 'GROUPS_KNOCKOUT',
        kind: 'CUP',
        sourceLeagueSystemId: leagueSystem.id,
        manualTeamSelection: true,
        numGroups: 8,
        groupSize: 4,
        qualifiersPerGroup: 2,
        knockoutQualifiers: 16,
        twoLeggedStages: ['R16', 'QUARTER', 'SEMI'],
        status: 'DRAFT',
      },
    });
  }

  const teamData = [
    { name: 'Águilas FC', email: 'aguilas@torneo.com' },
    { name: 'Tigres United', email: 'tigres@torneo.com' },
  ];

  const regs: string[] = [];
  for (const td of teamData) {
    const team = await prisma.team.create({ data: { name: td.name } });
    await prisma.user.create({
      data: {
        email: td.email,
        passwordHash: await argon2.hash('Team1234'),
        role: 'TEAM_LEADER',
        teamId: team.id,
      },
    });
    const reg = await prisma.teamRegistration.create({
      data: { teamId: team.id, competitionId: comp.id },
    });
    regs.push(reg.id);
    for (let i = 1; i <= 2; i++) {
      const player = await prisma.player.create({
        data: {
          documentType: 'CEDULA',
          documentNumber: `${td.name.slice(0, 2).toUpperCase()}${i}${Math.floor(1000 + Math.random() * 9000)}`,
          firstName: `Jugador${i}`,
          lastName: td.name.split(' ')[0],
          birthDate: new Date('1998-05-10'),
          position: 'Delantero',
        },
      });
      await prisma.rosterEntry.create({
        data: {
          teamRegistrationId: reg.id,
          playerId: player.id,
          jerseyNumber: i,
          stats: { create: {} },
        },
      });
    }
  }

  await prisma.match.create({
    data: {
      competitionId: comp.id,
      homeRegistrationId: regs[0],
      awayRegistrationId: regs[1],
      scheduledAt: new Date('2026-02-01T15:00:00Z'),
      status: 'SCHEDULED',
      matchday: 1,
    },
  });
  await prisma.match.create({
    data: {
      competitionId: comp.id,
      homeRegistrationId: regs[0],
      awayRegistrationId: regs[1],
      scheduledAt: new Date('2026-01-20T15:00:00Z'),
      status: 'FINISHED',
      matchday: 1,
      homeScore: 2,
      awayScore: 1,
    },
  });

  console.log('✅ Seed completo: admin, 9 categorías, edición demo, 2 equipos, jugadores y partidos.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
