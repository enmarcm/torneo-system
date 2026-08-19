-- Publicidad: nombre interno, más ubicaciones y varias por anuncio.

ALTER TABLE "Advertisement" ADD COLUMN "title" TEXT NOT NULL DEFAULT '';

-- El enum se recrea en lugar de usar ALTER TYPE ... ADD VALUE, que no puede
-- convivir con un UPDATE que use el valor nuevo dentro de la misma transacción.
CREATE TYPE "AdPlacement_new" AS ENUM (
  'HOME_BANNER',
  'HOME_INLINE',
  'SIDEBAR',
  'FOOTER',
  'FOOTER_LOGOS',
  'MATCH_LIST',
  'MATCH_DETAIL',
  'STANDINGS',
  'LIVE',
  'STATS',
  'TEAMS'
);

ALTER TABLE "Advertisement"
  ADD COLUMN "placements" "AdPlacement_new"[] NOT NULL DEFAULT ARRAY[]::"AdPlacement_new"[];

-- Los tres valores viejos siguen existiendo en el enum nuevo, así que la
-- ubicación actual de cada anuncio se conserva tal cual.
UPDATE "Advertisement" SET "placements" = ARRAY["placement"::text::"AdPlacement_new"];

ALTER TABLE "Advertisement" DROP COLUMN "placement";
DROP TYPE "AdPlacement";
ALTER TYPE "AdPlacement_new" RENAME TO "AdPlacement";
