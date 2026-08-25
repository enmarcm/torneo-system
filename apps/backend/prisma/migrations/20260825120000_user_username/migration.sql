-- El acceso pasa a ser por nombre de usuario. El administrador da de alta al
-- delegado con un usuario corto y una contraseña; el correo deja de ser la
-- credencial y lo carga el propio delegado cuando entra al sistema.

-- 1. Columna nueva, primero nullable para poder rellenarla.
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- 2. Se rellena con la parte local del correo actual, en minúsculas y sin
--    caracteres que no sirvan para escribir un usuario. Si dos correos comparten
--    esa parte (juan@a.com y juan@b.com), al repetido se le agrega un número
--    para no romper el índice único que viene después.
WITH base AS (
    SELECT
        "id",
        COALESCE(
            NULLIF(regexp_replace(lower(split_part("email", '@', 1)), '[^a-z0-9._-]', '', 'g'), ''),
            'usuario'
        ) AS candidate
    FROM "User"
),
numbered AS (
    SELECT
        "id",
        candidate,
        row_number() OVER (PARTITION BY candidate ORDER BY "id") AS n
    FROM base
)
UPDATE "User" u
SET "username" = CASE WHEN numbered.n = 1 THEN numbered.candidate ELSE numbered.candidate || numbered.n::text END
FROM numbered
WHERE u."id" = numbered."id";

-- 3. Ya con datos, se vuelve obligatoria y única.
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- 4. El correo pasa a ser opcional. Sigue siendo único cuando está presente:
--    en Postgres los NULL no chocan entre sí en un índice único.
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
