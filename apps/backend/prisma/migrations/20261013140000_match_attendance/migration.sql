ALTER TABLE "Match" ADD COLUMN "attendanceUpdatedAt" TIMESTAMP(3);
CREATE TABLE "MatchAttendance" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "rosterEntryId" TEXT NOT NULL,
  "present" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MatchAttendance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MatchAttendance_matchId_rosterEntryId_key" ON "MatchAttendance"("matchId", "rosterEntryId");
CREATE INDEX "MatchAttendance_rosterEntryId_idx" ON "MatchAttendance"("rosterEntryId");
ALTER TABLE "MatchAttendance" ADD CONSTRAINT "MatchAttendance_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchAttendance" ADD CONSTRAINT "MatchAttendance_rosterEntryId_fkey" FOREIGN KEY ("rosterEntryId") REFERENCES "RosterEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
