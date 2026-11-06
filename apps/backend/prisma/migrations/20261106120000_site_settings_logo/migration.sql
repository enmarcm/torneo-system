-- Logo principal editable desde el panel. Vacío = el logo que trae el sitio.
ALTER TABLE "SiteSettings" ADD COLUMN "logoUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "logoDarkUrl" TEXT NOT NULL DEFAULT '';
