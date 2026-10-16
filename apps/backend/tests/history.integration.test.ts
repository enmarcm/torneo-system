import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { prisma } from '../src/lib/prisma';
import { historyService } from '../src/modules/history/history.service';
import { historyFiltersSchema } from '../src/modules/history/history.schema';
import { matchesService } from '../src/modules/matches/matches.service';
import { purgeTeam, purgePlayer, purgeCompetitions } from '../src/utils/cascade.util';
import { initSocket } from '../src/lib/socket';

test('real historical reports keep old/inactive records, paginate beyond 200 and enforce admin access', { skip: process.env.RUN_HISTORY_INTEGRATION !== '1' }, async () => {
  const prefix = `HIST-${randomUUID()}`;
  const editionIds = [randomUUID(), randomUUID()], competitionIds = [randomUUID(), randomUUID()];
  const teamIds = [randomUUID(), randomUUID()], registrationIds = Array.from({ length: 4 }, () => randomUUID());
  const playerIds = Array.from({ length: 206 }, () => randomUUID());
  const rosterIds = Array.from({ length: 207 }, () => randomUUID());
  const matchIds = Array.from({ length: 4 }, () => randomUUID());
  const userIds = Array.from({ length: 4 }, () => randomUUID());
  let server: ReturnType<ReturnType<typeof createApp>['listen']> | undefined;
  let socket: ReturnType<typeof initSocket> | undefined;
  try {
    await prisma.edition.createMany({ data: editionIds.map((id, index) => ({ id, name: `${prefix}-${index}`, year: 2024 + index, seasonNumber: 1, status: index ? 'ACTIVE' : 'FINISHED', startDate: new Date(`${2024 + index}-01-01`), endDate: new Date(`${2024 + index}-12-31`) })) });
    await prisma.competition.createMany({ data: competitionIds.map((id, index) => ({ id, editionId: editionIds[index], name: `${prefix}-torneo-${index}`, format: 'LEAGUE', kind: 'STANDALONE_LEAGUE', ageGroup: index ? 'YOUTH' : 'ADULT', status: index ? 'ACTIVE' : 'FINISHED' })) });
    await prisma.team.createMany({ data: teamIds.map((id, index) => ({ id, name: `${prefix}-club-${index}`, status: index ? 'ACTIVE' : 'INACTIVE' })) });
    await prisma.teamRegistration.createMany({ data: registrationIds.map((id, index) => ({ id, competitionId: competitionIds[Math.floor(index / 2)], teamId: teamIds[index % 2], status: index < 2 ? 'INACTIVE' : 'ACTIVE' })) });
    await prisma.player.createMany({ data: playerIds.map((id, index) => ({ id, documentType: 'CEDULA', documentNumber: `${prefix}-${index}`, firstName: `${prefix}-${String(index).padStart(3, '0')}`, lastName: 'Prueba', birthDate: new Date('2000-01-01'), status: index === 0 ? 'INACTIVE' : 'ACTIVE' })) });
    await prisma.rosterEntry.createMany({ data: [
      ...playerIds.map((playerId, index) => ({ id: rosterIds[index], playerId, teamRegistrationId: registrationIds[0], status: 'INACTIVE' as const })),
      { id: rosterIds[206], playerId: playerIds[0], teamRegistrationId: registrationIds[3], status: 'ACTIVE' },
    ] });
    await prisma.playerSeasonStats.createMany({ data: [
      { rosterEntryId: rosterIds[0], matchesPlayed: 2, goals: 3, yellowCards: 1 },
      { rosterEntryId: rosterIds[206], matchesPlayed: 1, goals: 5, redCards: 1 },
    ] });
    await prisma.match.createMany({ data: [
      { id: matchIds[0], competitionId: competitionIds[0], homeRegistrationId: registrationIds[0], awayRegistrationId: registrationIds[1], status: 'FINISHED', homeScore: 3, awayScore: 1, scheduledAt: new Date('2024-02-01') },
      { id: matchIds[1], competitionId: competitionIds[1], homeRegistrationId: registrationIds[2], awayRegistrationId: registrationIds[3], status: 'FINISHED', homeScore: 2, awayScore: 2, scheduledAt: new Date('2025-02-01') },
      { id: matchIds[2], competitionId: competitionIds[0], homeRegistrationId: registrationIds[0], awayRegistrationId: registrationIds[1], status: 'SCHEDULED', homeScore: 99, awayScore: 99 },
      { id: matchIds[3], competitionId: competitionIds[0], homeRegistrationId: registrationIds[0], awayRegistrationId: registrationIds[1], status: 'LIVE' },
    ] });
    await prisma.matchAttendance.createMany({ data: [
      { matchId: matchIds[0], rosterEntryId: rosterIds[0], present: true },
      { matchId: matchIds[1], rosterEntryId: rosterIds[206], present: false },
    ] });
    await prisma.matchEvent.create({ data: { matchId: matchIds[0], playerId: playerIds[0], teamRegistrationId: registrationIds[0], type: 'GOAL', minute: 5 } });
    const base = historyFiltersSchema.parse({ q: prefix, limit: 25 });
    const report = await historyService.report('players', base);
    assert.equal(report.total, 206); assert.equal(report.rows.length, 25); assert.equal(report.summary.goals, 8);
    assert.equal(report.rows[0].id, playerIds[0]); assert.equal(report.rows[0].teams, 2); assert.equal(report.rows[0].tournaments, 2);
    assert.equal(report.rows[0].matchesPlayed, 3);
    assert.equal((await historyService.report('players', { ...base, page: 9 })).rows.length, 6);
    const old = await historyService.report('players', { ...base, year: 2024, competitionId: competitionIds[0], teamId: teamIds[0] });
    assert.equal(old.total, 206); assert.equal(old.summary.goals, 3);
    assert.equal((await historyService.report('players', { ...base, status: 'INACTIVE' })).total, 1);
    assert.equal((await historyService.report('players', { ...base, ageGroup: 'YOUTH' })).total, 1);
    const teams = await historyService.report('teams', base);
    assert.equal(teams.total, 2);
    const club = teams.rows.find((row) => row.id === teamIds[0]);
    assert.equal(club.players, 206); assert.equal(club.matchesPlayed, 2); assert.equal(club.goals, 5); assert.equal(club.wins, 1); assert.equal(club.draws, 1);
    const player = await historyService.player(playerIds[0], base);
    assert.equal(player.career.length, 2); assert.equal(player.totalMatches, 2); assert.equal(player.totals.goals, 8);
    assert.equal((await historyService.player(playerIds[0], { ...base, year: 2024 })).totalMatches, 1);
    const team = await historyService.team(teamIds[0], base);
    assert.equal(team.players, 206); assert.equal(team.career.length, 2); assert.equal(team.totalMatches, 4);
    assert.equal(team.totals.matchesPlayed, 2); assert.equal(team.totals.goalsFor, 5);
    assert.equal(JSON.stringify(player).includes('identityPhotoKey'), false);
    await assert.rejects(prisma.$transaction((tx) => purgeTeam(tx, teamIds[0])), { code: 'HISTORY_PROTECTED' });
    await assert.rejects(prisma.$transaction((tx) => purgePlayer(tx, playerIds[0])), { code: 'HISTORY_PROTECTED' });
    await assert.rejects(prisma.$transaction((tx) => purgeCompetitions(tx, competitionIds)), { code: 'HISTORY_PROTECTED' });
    await assert.rejects(matchesService.remove(matchIds[0]), { code: 'HISTORY_PROTECTED' });
    server = createApp().listen(0, '127.0.0.1');
    socket = initSocket(server);
    await new Promise<void>((resolve) => server!.once('listening', resolve));
    await matchesService.finish(matchIds[0]);
    assert.equal((await prisma.playerSeasonStats.findUniqueOrThrow({ where: { rosterEntryId: rosterIds[0] } })).goals, 3);
    // Count one new finalization even if the same request arrives concurrently.
    await prisma.rosterEntry.update({ where: { id: rosterIds[0] }, data: { status: 'ACTIVE' } });
    await Promise.all([matchesService.finish(matchIds[3]), matchesService.finish(matchIds[3])]);
    assert.equal((await prisma.playerSeasonStats.findUniqueOrThrow({ where: { rosterEntryId: rosterIds[0] } })).matchesPlayed, 3);
    const roles = ['ADMIN', 'TEAM_LEADER', 'SCOREKEEPER', 'COMMUNITY_MANAGER'] as const;
    await prisma.user.createMany({ data: userIds.map((id, index) => ({ id, username: `${prefix}-user-${index}`, passwordHash: 'integration-no-login', role: roles[index] })) });
    const address = server.address(); assert.ok(address && typeof address !== 'string');
    const url = `http://127.0.0.1:${address.port}/api/history`;
    assert.equal((await fetch(`${url}/players`)).status, 401);
    for (let index = 0; index < roles.length; index++) {
      const headers = { Authorization: `Bearer ${jwt.sign({ id: userIds[index] }, env.JWT_ACCESS_SECRET)}` };
      assert.equal((await fetch(`${url}/players?q=${prefix}`, { headers })).status, index === 0 ? 200 : 403);
      assert.equal((await fetch(`${url}/players/${playerIds[0]}`, { headers })).status, index === 0 ? 200 : 403);
      assert.equal((await fetch(`${url}/teams/${teamIds[0]}`, { headers })).status, index === 0 ? 200 : 403);
      if (index === 0) assert.equal((await fetch(`${url}/teams?limit=999`, { headers })).status, 422);
    }
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise<void>((resolve) => socket ? socket.close(() => resolve()) : server!.close(() => resolve()));
    }
    await prisma.$transaction(async (tx) => {
      await tx.matchAttendance.deleteMany({ where: { matchId: { in: matchIds } } });
      await tx.matchEvent.deleteMany({ where: { matchId: { in: matchIds } } });
      await tx.match.deleteMany({ where: { id: { in: matchIds } } });
      await tx.playerSeasonStats.deleteMany({ where: { rosterEntryId: { in: rosterIds } } });
      await tx.rosterEntry.deleteMany({ where: { id: { in: rosterIds } } });
      await tx.teamRegistration.deleteMany({ where: { id: { in: registrationIds } } });
      await tx.competition.deleteMany({ where: { id: { in: competitionIds } } });
      await tx.edition.deleteMany({ where: { id: { in: editionIds } } });
      await tx.team.deleteMany({ where: { id: { in: teamIds } } });
      await tx.player.deleteMany({ where: { id: { in: playerIds } } });
      await tx.user.deleteMany({ where: { id: { in: userIds } } });
    });
    await prisma.$disconnect();
  }
});
