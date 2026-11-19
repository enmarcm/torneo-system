-- Pase de jugador: un club por jugador en cada apartado (Adultos / Menores).
CREATE TABLE "PlayerClub" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "ageGroup" "CompetitionAgeGroup" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerClub_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlayerClub_playerId_ageGroup_key" ON "PlayerClub"("playerId", "ageGroup");
CREATE INDEX "PlayerClub_teamId_idx" ON "PlayerClub"("teamId");

ALTER TABLE "PlayerClub" ADD CONSTRAINT "PlayerClub_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlayerClub" ADD CONSTRAINT "PlayerClub_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Relleno desde lo que hay hoy: el pase lo tiene el club donde el jugador está
-- activo en una competición que no terminó. Si estaba activo en dos clubes del
-- mismo apartado, gana la inscripción más reciente; los jugadores que solo
-- jugaron torneos ya terminados quedan libres.
INSERT INTO "PlayerClub" ("id", "playerId", "teamId", "ageGroup")
SELECT DISTINCT ON (re."playerId", c."ageGroup")
    gen_random_uuid()::text, re."playerId", tr."teamId", c."ageGroup"
FROM "RosterEntry" re
JOIN "TeamRegistration" tr ON tr."id" = re."teamRegistrationId"
JOIN "Competition" c ON c."id" = tr."competitionId"
WHERE re."status" = 'ACTIVE' AND tr."status" = 'ACTIVE' AND c."status" <> 'FINISHED'
ORDER BY re."playerId", c."ageGroup", re."createdAt" DESC;
