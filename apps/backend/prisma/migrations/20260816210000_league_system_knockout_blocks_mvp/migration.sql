-- CreateEnum
CREATE TYPE "CompetitionKind" AS ENUM ('LEAGUE_DIVISION', 'CUP', 'YOUTH', 'SPECIAL');

-- CreateEnum
CREATE TYPE "RegistrationOutcome" AS ENUM ('NONE', 'PROMOTED', 'RELEGATED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "TeamBlockScope" AS ENUM ('CLUB', 'COMPETITION');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "defaultDivisionLevel" INTEGER,
ADD COLUMN     "defaultKind" "CompetitionKind" NOT NULL DEFAULT 'SPECIAL';

-- AlterTable
ALTER TABLE "Competition" ADD COLUMN     "divisionLevel" INTEGER,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "kind" "CompetitionKind" NOT NULL DEFAULT 'SPECIAL',
ADD COLUMN     "leagueSystemId" TEXT,
ADD COLUMN     "promotionSpots" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "relegationSpots" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rounds" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "sourceLeagueSystemId" TEXT,
ADD COLUMN     "twoLeggedStages" "MatchStage"[] DEFAULT ARRAY[]::"MatchStage"[];

-- AlterTable
ALTER TABLE "TeamRegistration" ADD COLUMN     "outcome" "RegistrationOutcome" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "outcomeNote" TEXT;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "leg" INTEGER,
ADD COLUMN     "mvpNote" TEXT,
ADD COLUMN     "mvpPhotoUrl" TEXT,
ADD COLUMN     "mvpPlayerId" TEXT,
ADD COLUMN     "tieId" TEXT,
ALTER COLUMN "scheduledAt" DROP NOT NULL;

-- CreateTable
CREATE TABLE "LeagueSystem" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeagueSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamBlock" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "scope" "TeamBlockScope" NOT NULL DEFAULT 'CLUB',
    "competitionId" TEXT,
    "reason" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "blockedById" TEXT,
    "liftedById" TEXT,
    "liftedAt" TIMESTAMP(3),
    "liftReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnockoutTie" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "stage" "MatchStage" NOT NULL,
    "slot" INTEGER NOT NULL,
    "twoLegged" BOOLEAN NOT NULL DEFAULT false,
    "homeRegistrationId" TEXT,
    "awayRegistrationId" TEXT,
    "winnerRegistrationId" TEXT,
    "nextTieId" TEXT,
    "nextSlotIsHome" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnockoutTie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeagueSystem_editionId_idx" ON "LeagueSystem"("editionId");

-- CreateIndex
CREATE INDEX "TeamBlock_teamId_idx" ON "TeamBlock"("teamId");

-- CreateIndex
CREATE INDEX "TeamBlock_competitionId_idx" ON "TeamBlock"("competitionId");

-- CreateIndex
CREATE INDEX "TeamBlock_active_idx" ON "TeamBlock"("active");

-- CreateIndex
CREATE INDEX "KnockoutTie_competitionId_idx" ON "KnockoutTie"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "KnockoutTie_competitionId_stage_slot_key" ON "KnockoutTie"("competitionId", "stage", "slot");

-- CreateIndex
CREATE INDEX "Competition_leagueSystemId_idx" ON "Competition"("leagueSystemId");

-- CreateIndex
CREATE INDEX "Match_tieId_idx" ON "Match"("tieId");

-- AddForeignKey
ALTER TABLE "LeagueSystem" ADD CONSTRAINT "LeagueSystem_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_leagueSystemId_fkey" FOREIGN KEY ("leagueSystemId") REFERENCES "LeagueSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_sourceLeagueSystemId_fkey" FOREIGN KEY ("sourceLeagueSystemId") REFERENCES "LeagueSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamBlock" ADD CONSTRAINT "TeamBlock_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamBlock" ADD CONSTRAINT "TeamBlock_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamBlock" ADD CONSTRAINT "TeamBlock_blockedById_fkey" FOREIGN KEY ("blockedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamBlock" ADD CONSTRAINT "TeamBlock_liftedById_fkey" FOREIGN KEY ("liftedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnockoutTie" ADD CONSTRAINT "KnockoutTie_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnockoutTie" ADD CONSTRAINT "KnockoutTie_homeRegistrationId_fkey" FOREIGN KEY ("homeRegistrationId") REFERENCES "TeamRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnockoutTie" ADD CONSTRAINT "KnockoutTie_awayRegistrationId_fkey" FOREIGN KEY ("awayRegistrationId") REFERENCES "TeamRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnockoutTie" ADD CONSTRAINT "KnockoutTie_winnerRegistrationId_fkey" FOREIGN KEY ("winnerRegistrationId") REFERENCES "TeamRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnockoutTie" ADD CONSTRAINT "KnockoutTie_nextTieId_fkey" FOREIGN KEY ("nextTieId") REFERENCES "KnockoutTie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tieId_fkey" FOREIGN KEY ("tieId") REFERENCES "KnockoutTie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_mvpPlayerId_fkey" FOREIGN KEY ("mvpPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

