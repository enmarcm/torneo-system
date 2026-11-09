-- Papelera general: foto de lo borrado para poder restaurarlo.
CREATE TYPE "TrashKind" AS ENUM ('EDITION', 'COMPETITION', 'TEAM', 'PLAYER', 'USER', 'MATCH', 'MATCH_EVENT', 'AD', 'ARTICLE', 'LEGAL_PAGE');

CREATE TABLE "TrashItem" (
    "id" TEXT NOT NULL,
    "kind" "TrashKind" NOT NULL,
    "entityId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "detail" TEXT,
    "summary" JSONB NOT NULL,
    "payload" JSONB NOT NULL,
    "deletedById" TEXT,
    "deletedByName" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrashItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TrashItem_kind_idx" ON "TrashItem"("kind");
CREATE INDEX "TrashItem_createdAt_idx" ON "TrashItem"("createdAt");
CREATE INDEX "TrashItem_expiresAt_idx" ON "TrashItem"("expiresAt");
