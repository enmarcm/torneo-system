import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma';
import { teamsService } from '../src/modules/teams/teams.service';
import { competitionsService } from '../src/modules/competitions/competitions.service';
import { createCompetitionSchema, updateCompetitionSchema } from '../src/modules/competitions/competitions.schema';

// Prisma delegates expose methods through a proxy; assign mocks explicitly.
const stub = (t: TestContext, delegate: object, method: string, implementation: (...args: any[]) => any) => {
  const original = Reflect.get(delegate, method);
  const mocked = t.mock.fn(implementation);
  Reflect.set(delegate, method, mocked);
  t.after(() => { Reflect.set(delegate, method, original); });
  return mocked;
};

const editionId = '11111111-1111-4111-8111-111111111111';

test('all editions returns every competition and selecting an edition restricts the list', async (t) => {
  const records = [
    { id: 'first', editionId, name: 'Liga', _count: { registrations: 2, matches: 1 } },
    { id: 'second', editionId: 'second-edition', name: 'Liga', _count: { registrations: 3, matches: 4 } },
  ];
  const list = stub(t, prisma.competition, 'findMany', async ({ where, include }) => {
    assert.equal(include._count.select.registrations, true);
    assert.equal(include._count.select.matches, true);
    return records.filter((competition) => !where.editionId || competition.editionId === where.editionId);
  });
  assert.deepEqual((await competitionsService.list()).map((competition) => competition.id), ['first', 'second']);
  assert.deepEqual(list.mock.calls[0].arguments[0].where, {});
  assert.deepEqual((await competitionsService.list(editionId)).map((competition) => competition.id), ['first']);
  assert.deepEqual(list.mock.calls[1].arguments[0].where, { editionId });
  assert.deepEqual((await competitionsService.list()).map((competition) => competition.id), ['first', 'second']);
});

test('create a competition directly and retain its rules without a category', async (t) => {
  const input = createCompetitionSchema.parse({ editionId, name: '  Veteranos  ', ageMin: 35, requiresAdminEligibility: true, description: 'Reglamento', minPlayers: 7, maxPlayers: 20 });
  const create = stub(t, prisma.competition, 'create', async ({ data }: { data: Record<string, unknown> }) => data);
  const result = await competitionsService.create(input);
  assert.equal(result.name, 'Veteranos');
  assert.equal(result.ageMin, null);
  assert.equal(result.requiresAdminEligibility, true);
  assert.equal(result.description, 'Reglamento');
  assert.equal(result.minPlayers, 7);
  assert.equal(result.maxPlayers, 20);
  assert.equal('categoryId' in result, false);
  assert.equal(create.mock.callCount(), 1);
});

test('league divisions retain their automatic knockout and promotion rules', async (t) => {
  stub(t, prisma.leagueSystem, 'findFirst', async () => ({ id: 'league' }));
  stub(t, prisma.competition, 'findFirst', async () => null);
  stub(t, prisma.competition, 'create', async ({ data }: { data: Record<string, unknown> }) => data);
  const result = await competitionsService.create(createCompetitionSchema.parse({ editionId, name: 'Primera', kind: 'LEAGUE_DIVISION', divisionLevel: 1, promotionSpots: 2, relegationSpots: 2 }));
  assert.equal(result.knockoutQualifiers, 8);
  assert.equal(result.promotionSpots, 0);
  assert.equal(result.relegationSpots, 2);
  assert.deepEqual(result.twoLeggedStages, []);
  assert.equal(result.leagueSystemId, 'league');
});

test('blank names are rejected; image-only updates and clearing ages remain valid', () => {
  assert.equal(createCompetitionSchema.safeParse({ editionId, name: '   ' }).success, false);
  assert.equal(createCompetitionSchema.safeParse({ editionId, name: 'Torneo', minPlayers: 0 }).success, false);
  assert.deepEqual(updateCompetitionSchema.parse({ ageMin: null, ageMax: null }), { ageMin: null, ageMax: null });
  assert.deepEqual(updateCompetitionSchema.parse({ imageUrl: null }), { imageUrl: null });
});

test('roster ranges are still validated before persistence', async () => {
  await assert.rejects(competitionsService.create({ editionId, name: 'Torneo', minPlayers: 30, maxPlayers: 20 }), { code: 'INVALID_ROSTER_LIMITS' });
});

test('partial edits can remove age restrictions and eligibility directly', async (t) => {
  stub(t, prisma.competition, 'findUnique', async () => ({ id: 'competition', editionId, kind: 'SPECIAL', ageGroup: 'ADULT', format: 'LEAGUE', divisionLevel: null, ageMin: 35, ageMax: 50, minPlayers: 11, maxPlayers: 25 }));
  stub(t, prisma.competition, 'update', async ({ data }: { data: Record<string, unknown> }) => data);
  const result = await competitionsService.update('competition', { ageMin: null, ageMax: null, requiresAdminEligibility: false });
  assert.equal(result.ageMin, null);
  assert.equal(result.ageMax, null);
  assert.equal(result.requiresAdminEligibility, false);
  const legacyUpdate = await competitionsService.update('competition', { ageMin: 60 });
  assert.equal(legacyUpdate.ageMin, null);
  assert.equal(legacyUpdate.ageMax, null);
});

test('legacy age inputs are ignored when creating a competition', async (t) => {
  stub(t, prisma.competition, 'create', async ({ data }) => data);
  const result = await competitionsService.create(createCompetitionSchema.parse({ editionId, name: 'Sin restricción', ageMin: 180, ageMax: -5 }));
  assert.equal(result.ageMin, null);
  assert.equal(result.ageMax, null);
});


test('standalone leagues in both sections ignore division links and promotion spots', async (t) => {
  stub(t, prisma.competition, 'create', async ({ data }: { data: Record<string, unknown> }) => data);
  const lookup = stub(t, prisma.leagueSystem, 'findFirst', async () => { throw new Error('Independent leagues must not look up division systems'); });
  for (const ageGroup of ['ADULT', 'YOUTH'] as const) {
    const result = await competitionsService.create({ editionId, name: 'Liga', ageGroup, kind: 'STANDALONE_LEAGUE', format: 'LEAGUE', divisionLevel: 1, leagueSystemId: 'irrelevant', promotionSpots: 2, relegationSpots: 2 });
    assert.equal(result.ageGroup, ageGroup);
    assert.equal(result.divisionLevel, null);
    assert.equal(result.leagueSystemId, null);
    assert.equal(result.sourceLeagueSystemId, null);
    assert.equal(result.promotionSpots, 0);
    assert.equal(result.relegationSpots, 0);
    assert.equal(result.knockoutQualifiers, null);
  }
  assert.equal(lookup.mock.callCount(), 0);
});

test('adult and youth divisions resolve separate systems within the same edition', async (t) => {
  const lookup = stub(t, prisma.leagueSystem, 'findFirst', async ({ where }) => ({ id: `league-${where.ageGroup}` }));
  const taken = stub(t, prisma.competition, 'findFirst', async () => null);
  stub(t, prisma.competition, 'create', async ({ data }: { data: Record<string, unknown> }) => data);
  for (const ageGroup of ['ADULT', 'YOUTH'] as const) {
    const result = await competitionsService.create({ editionId, name: 'Primera', ageGroup, kind: 'LEAGUE_DIVISION', divisionLevel: 1 });
    assert.equal(result.leagueSystemId, `league-${ageGroup}`);
  }
  assert.deepEqual(lookup.mock.calls.map((c) => c.arguments[0].where), [{ editionId, ageGroup: 'ADULT' }, { editionId, ageGroup: 'YOUTH' }]);
  assert.deepEqual(taken.mock.calls.map((c) => c.arguments[0].where.leagueSystemId), ['league-ADULT', 'league-YOUTH']);
});

test('a divided league needs a division and cannot use the cup format', async () => {
  await assert.rejects(competitionsService.create({ editionId, name: 'Liga', kind: 'LEAGUE_DIVISION' }), { code: 'DIVISION_REQUIRED' });
  await assert.rejects(competitionsService.create({ editionId, name: 'Liga', kind: 'LEAGUE_DIVISION', divisionLevel: 1, format: 'GROUPS_KNOCKOUT' }), { code: 'INVALID_LEAGUE_FORMAT' });
});

test('linking a youth division to an adult league is rejected', async (t) => {
  stub(t, prisma.leagueSystem, 'findUnique', async () => ({ id: 'adult-league', editionId, ageGroup: 'ADULT' }));
  await assert.rejects(competitionsService.create({ editionId, name: 'Menores', ageGroup: 'YOUTH', kind: 'LEAGUE_DIVISION', divisionLevel: 1, leagueSystemId: 'adult-league' }), { code: 'LEAGUE_SCOPE_MISMATCH' });
});

test('changing from a division to a standalone league clears division rules', async (t) => {
  stub(t, prisma.competition, 'findUnique', async () => ({ id: 'competition', editionId, kind: 'LEAGUE_DIVISION', ageGroup: 'ADULT', format: 'LEAGUE', leagueSystemId: 'adult-league', divisionLevel: 1, division: 'Primera', minPlayers: 11, maxPlayers: 25, knockoutQualifiers: 8 }));
  stub(t, prisma.competition, 'update', async ({ data }: { data: Record<string, unknown> }) => data);
  const result = await competitionsService.update('competition', { kind: 'STANDALONE_LEAGUE' });
  assert.equal(result.leagueSystemId, null);
  assert.equal(result.divisionLevel, null);
  assert.equal(result.division, null);
  assert.equal(result.promotionSpots, 0);
  assert.equal(result.relegationSpots, 0);
  assert.equal(result.knockoutQualifiers, null);
});

test('team division conflicts are scoped to the section and league system', async (t) => {
  stub(t, prisma.competition, 'findUnique', async () => ({ id: 'youth-division', editionId, kind: 'LEAGUE_DIVISION', ageGroup: 'YOUTH', leagueSystemId: 'youth-league' }));
  const lookup = stub(t, prisma.teamRegistration, 'findFirst', async () => null);
  stub(t, prisma.teamRegistration, 'create', async ({ data }: { data: Record<string, unknown> }) => data);
  await teamsService.register('club', 'youth-division');
  assert.deepEqual(lookup.mock.calls[1].arguments[0].where.competition, { editionId, ageGroup: 'YOUTH', leagueSystemId: 'youth-league', kind: 'LEAGUE_DIVISION' });
});


test('standalone leagues cannot assign promotion or relegation; withdrawal remains available', async (t) => {
  stub(t, prisma.teamRegistration, 'findUnique', async () => ({ id: 'registration', competition: { kind: 'STANDALONE_LEAGUE' } }));
  const update = stub(t, prisma.teamRegistration, 'update', async ({ data }: { data: Record<string, unknown> }) => data);
  await assert.rejects(competitionsService.setRegistrationOutcome('registration', 'PROMOTED'), { code: 'DIVISION_OUTCOME_REQUIRED' });
  await assert.rejects(competitionsService.setRegistrationOutcome('registration', 'RELEGATED'), { code: 'DIVISION_OUTCOME_REQUIRED' });
  assert.equal(update.mock.callCount(), 0);
  const result = await competitionsService.setRegistrationOutcome('registration', 'WITHDRAWN');
  assert.equal(result.outcome, 'WITHDRAWN');
});


test('moving a divided competition between sections resolves its new league', async (t) => {
  stub(t, prisma.competition, 'findUnique', async () => ({ id: 'competition', editionId, kind: 'LEAGUE_DIVISION', ageGroup: 'ADULT', format: 'LEAGUE', leagueSystemId: 'adult-league', divisionLevel: 2, minPlayers: 11, maxPlayers: 25 }));
  const lookup = stub(t, prisma.leagueSystem, 'findFirst', async () => ({ id: 'youth-league' }));
  stub(t, prisma.competition, 'findFirst', async () => null);
  stub(t, prisma.competition, 'update', async ({ data }: { data: Record<string, unknown> }) => data);
  const result = await competitionsService.update('competition', { ageGroup: 'YOUTH' });
  assert.equal(result.ageGroup, 'YOUTH');
  assert.equal(result.leagueSystemId, 'youth-league');
  assert.equal(result.divisionLevel, 2);
  assert.deepEqual(lookup.mock.calls[0].arguments[0].where, { editionId, ageGroup: 'YOUTH' });
});
