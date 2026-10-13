ALTER TABLE "Competition" ADD COLUMN "ageGroup" "CompetitionAgeGroup" NOT NULL DEFAULT 'ADULT';
ALTER TABLE "LeagueSystem" ADD COLUMN "ageGroup" "CompetitionAgeGroup" NOT NULL DEFAULT 'ADULT';
UPDATE "Competition" SET "ageGroup" = 'YOUTH' WHERE "kind" = 'YOUTH';
UPDATE "Competition" SET "kind" = 'STANDALONE_LEAGUE'
WHERE "kind" IN ('YOUTH', 'SPECIAL') AND "format" = 'LEAGUE'
  AND "leagueSystemId" IS NULL AND "sourceLeagueSystemId" IS NULL;
ALTER TABLE "Competition" ALTER COLUMN "kind" SET DEFAULT 'STANDALONE_LEAGUE';
UPDATE "Competition" SET "promotionSpots" = 0, "relegationSpots" = 0,
"division" = NULL, "divisionLevel" = NULL WHERE "kind" = 'STANDALONE_LEAGUE';
