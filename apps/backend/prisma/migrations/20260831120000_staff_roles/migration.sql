-- Dos perfiles de staff nuevos, para que el administrador general deje de ser
-- la única cuenta con la que se carga contenido:
--   COMMUNITY_MANAGER  publicidad e imágenes de categorías, competiciones y equipos.
--   SCOREKEEPER        resultados de los partidos.
--
-- `ADD VALUE` no admite IF NOT EXISTS en todas las versiones soportadas, así que
-- se consulta el catálogo antes de agregar cada valor.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'UserRole' AND e.enumlabel = 'COMMUNITY_MANAGER'
    ) THEN
        ALTER TYPE "UserRole" ADD VALUE 'COMMUNITY_MANAGER';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'UserRole' AND e.enumlabel = 'SCOREKEEPER'
    ) THEN
        ALTER TYPE "UserRole" ADD VALUE 'SCOREKEEPER';
    END IF;
END
$$;
