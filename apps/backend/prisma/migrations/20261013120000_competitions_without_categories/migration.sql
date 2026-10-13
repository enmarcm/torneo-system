-- Copy inherited metadata without altering registrations, rosters or matches.
ALTER TABLE "Competition" ADD COLUMN "description" TEXT;
UPDATE "Competition" AS c
SET "description" = cat."description", "imageUrl" = COALESCE(c."imageUrl", cat."imageUrl")
FROM "Category" AS cat WHERE c."categoryId" = cat."id";
ALTER TABLE "Competition" DROP CONSTRAINT "Competition_categoryId_fkey";
DROP INDEX "Competition_categoryId_idx";
ALTER TABLE "Competition" DROP COLUMN "categoryId";
-- Retain the former catalogue for recovery, outside the application model.
ALTER TABLE "Category" RENAME TO "CategoryArchive";
