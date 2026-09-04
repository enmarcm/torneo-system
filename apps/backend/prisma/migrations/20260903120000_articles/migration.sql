-- Apartado de noticias del sitio público. Una publicación puede ser una nota
-- escrita a mano o una ficha técnica de una edición, un torneo o un equipo.
--
-- Las claves foráneas van con ON DELETE SET NULL a propósito: borrar una
-- edición o un equipo no debe llevarse la nota que ya se publicó, que conserva
-- sus números congelados en "snapshot".
CREATE TYPE "ArticleKind" AS ENUM ('NEWS', 'EDITION_SHEET', 'COMPETITION_SHEET', 'TEAM_SHEET');
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "kind" "ArticleKind" NOT NULL DEFAULT 'NEWS',
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL DEFAULT '',
    "coverUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "editionId" TEXT,
    "competitionId" TEXT,
    "teamId" TEXT,
    "year" INTEGER,
    "snapshot" JSONB,
    "snapshotAt" TIMESTAMP(3),
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");
CREATE INDEX "Article_kind_idx" ON "Article"("kind");
CREATE INDEX "Article_editionId_idx" ON "Article"("editionId");
CREATE INDEX "Article_teamId_idx" ON "Article"("teamId");

ALTER TABLE "Article" ADD CONSTRAINT "Article_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Article" ADD CONSTRAINT "Article_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Article" ADD CONSTRAINT "Article_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
