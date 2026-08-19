-- Partido destacado de la jornada: lo marca el administrador al programarlo.
ALTER TABLE "Match" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
