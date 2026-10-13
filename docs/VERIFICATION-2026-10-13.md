# Verificación: competiciones sin categorías

Fecha: 13-10-2026.

- Backend `npm --workspace apps/backend run typecheck`: PASS.
- Frontend `npm --workspace apps/frontend run build`: PASS (aviso de chunks grandes).
- Frontend `npm --workspace apps/frontend run typecheck`: PASS.
- Shared `npx tsc --noEmit -p packages/shared/tsconfig.json`: PASS.
- Prisma generate y validate: PASS.
- `npx tsx --test tests/competitions.test.ts` desde apps/backend: PASS, 13 pruebas con persistencia simulada; no sustituyen una prueba con PostgreSQL.
- `git diff --check`: PASS.
- Referencias funcionales a categorías en frontend, backend y seed: eliminadas.
- Docker: no disponible; el daemon no responde.
- Migración `prisma migrate deploy`: FAIL por entorno, PostgreSQL no disponible en localhost:8217.
- Seed, CRUD con base real, API, inspección visual y tiempo real: pendientes del entorno.

Resultado global: verificación integral pendiente. La migración está preparada y documentada en MIGRATIONS.md; no se aplicó a una base real.

## Adultos y Menores

Los apartados se guardan en cada competición y aparecen en administración y vista pública. Las pruebas cubren ligas independientes en ambos apartados, sistemas de divisiones separados, rechazo de vínculos entre apartados, cambio de apartado, inscripción por sistema de liga y bloqueo de ascenso/descenso fuera de divisiones.

Prisma generate/validate, typecheck backend/shared y build frontend: PASS. `docker compose ps` se volvió a ejecutar y el daemon de Docker Desktop sigue no disponible. Las dos migraciones nuevas no se aplicaron; la verificación integral y el guardado con base real siguen pendientes. No hay navegadores habilitados para inspección visual en esta sesión.

## Asistencia por partido

Prisma generate/validate, typecheck backend/shared y build frontend: PASS. Se agregó el formulario para ambos equipos y el acceso Asistencia en programación, también para partidos sin fecha. El anotador conserva permisos de programación restringidos.

`npx tsx --tsconfig apps/backend/tsconfig.json --test apps/backend/tests/attendance.test.ts`: PASS, 7 pruebas. Cubren presentes/ausentes y correcciones sin duplicados, alcance a los equipos y al torneo, rechazo de IDs ajenos/duplicados/datos inválidos, partido inexistente y peticiones HTTP reales contra un servidor local de pruebas para ADMIN/SCOREKEEPER (200), COMMUNITY_MANAGER/TEAM_LEADER (403), sin sesión (401) y datos inválidos (422). También se probó que cambiar equipos reinicia la asistencia y reprogramar conserva los registros. La persistencia y la sesión se simulan; estas pruebas no acreditan guardado en PostgreSQL.

Migración nueva: 20261013140000_match_attendance. Su aplicación y la inspección visual siguen pendientes por entorno; Docker no estaba disponible y no había navegadores habilitados. La asistencia no altera las estadísticas de juego.

## Torneos del delegado y altas en plantilla

- Backend typecheck, shared typecheck y frontend build: PASS.
- `npx tsx --tsconfig apps/backend/tsconfig.json --test apps/backend/tests/delegation.test.ts`: PASS, 6 pruebas.
- Peticiones HTTP locales prueban la secuencia con controladores/servicios reales: ADMIN inscribe equipo (201), TEAM_LEADER consulta sus inscripciones (200) y crea un jugador directamente en la plantilla (201). Se rechazan asignación de torneos por el delegado, lectura/alta en otro equipo y alta de perfiles sin plantilla (403).
- Se prueban edad, cupo, inscripción cerrada, documento duplicado, inscripción inexistente, reutilización de un jugador en otra plantilla y rollback si falla el alta de la inscripción. La persistencia se simula; no certifica transacciones de PostgreSQL.
- Mis torneos usa IDs de inscripción, separa Adultos/Menores y ofrece nuevas altas o jugadores existentes. Se consulta solo el equipo del delegado. Refresco cada 30 segundos para detectar inscripciones del administrador.
- No requiere un cambio nuevo de esquema. La prueba con PostgreSQL y la inspección visual siguen pendientes: Docker no disponible y sin navegador habilitado.

## Divisiones ajenas y plantillas desactualizadas del delegado

Partidos e Historial dejaron de consultar el catálogo global. Ahora sus opciones y tarjetas salen de las inscripciones de este equipo; los partidos se consultan en el endpoint del propio equipo, sin traer una página global y filtrar después. Mis torneos muestra inscripciones actuales por defecto y permite consultar las anteriores explícitamente, conservando sus jugadores.

Las plantillas se renuevan al abrirse y al recuperar el foco. Las inscripciones y el editor del delegado se refrescan cada 30 segundos. Las mutaciones esperan la actualización de sus consultas antes de terminar. Una plantilla vacía que está recargando muestra carga, no un falso estado vacío.

Al cerrar sesión o cambiar usuario, rol o equipo, se limpia la caché. Renovar el token de la misma cuenta conserva sus datos.

`npx tsx --tsconfig apps/frontend/tsconfig.json --test apps/frontend/tests/delegate-data.test.ts`: PASS, 5 pruebas. Incluyen una sola división asignada, historial de inscripciones cerradas, ediciones del equipo, aislamiento de caché entre cuentas y rechazo de respuestas tardías de la cuenta anterior. El entorno Node no dispone de almacenamiento de navegador; la prueba cubre la caché en memoria.

Se volvieron a ejecutar las 6 pruebas HTTP/servicio de delegación: PASS. Typecheck backend/shared y build frontend: PASS. Sigue pendiente la verificación con PostgreSQL y navegador del entorno real.

## Fotos obligatorias del jugador y del documento

Se agrega `Player.identityPhotoKey` (migración 20261013150000_player_identity_photo). Formularios de altas del delegado, altas del administrador y edición incluyen ambas fotos obligatorias. Guardar queda deshabilitado mientras falte una o se esté subiendo. El servidor valida campos, existencia del documento privado y propiedad de archivos nuevos. Agregar o importar jugadores existentes y reactivar plantillas requiere fotos completas.

La foto del documento se guarda en el bucket privado y se sirve por el API autenticado con `Cache-Control: private, no-store`; esto evita enviar al navegador URLs de MinIO internas de Docker. Solo pueden acceder ADMIN o delegados de un equipo del jugador; el uploader puede previsualizar su archivo antes de que exista la ficha. SCOREKEEPER, COMMUNITY_MANAGER, cuentas sin sesión y otros equipos quedan bloqueados. Las vistas públicas y la plantilla reducida del anotador no incluyen el documento.

Prisma generate/validate, typecheck backend/shared y build frontend: PASS. `player-photos.test.ts`: PASS, 5 pruebas de obligatoriedad, archivos inexistentes, propiedad de archivos, inscripción de jugadores antiguos y upload/lectura privada por HTTP (almacenamiento simulado). `delegation.test.ts`: PASS, 6 pruebas actualizadas para la nueva obligación.

Verificación adicional: se inició Docker Desktop y se levantaron PostgreSQL y MinIO locales. Las 13 migraciones se aplicaron correctamente a una base local nueva; el seed terminó correctamente. Esto verifica instalación desde cero, no actualización de una base histórica con datos.

`player-photos.integration.test.ts` con `RUN_STORAGE_INTEGRATION=1`: PASS. Usa el API completo, sesión del administrador, Prisma y MinIO reales: subida de ambas imágenes, lectura pública del avatar, lectura autenticada del documento WebP, acceso directo anónimo al bucket privado rechazado (403), API sin sesión rechazado (401), alta sin cualquiera de las fotos rechazada (422) y alta completa persistida (201). La ficha y los objetos temporales se eliminaron al terminar. Se usó una imagen sintética de prueba; no se completaron registros anteriores con documentos ficticios.

Para repetir localmente en PowerShell, desde la raíz: `$env:RUN_STORAGE_INTEGRATION='1'; $env:MINIO_ENDPOINT='localhost'; $env:MINIO_PORT='6773'; $env:PUBLIC_ASSETS_BASE_URL='http://localhost:6773'; npx.cmd tsx --tsconfig apps/backend/tsconfig.json --test apps/backend/tests/player-photos.integration.test.ts`. La prueba es optativa y no se ejecuta contra servicios reales sin esa variable.

La inspección visual sigue pendiente porque no hay navegador habilitado. Las pruebas integrales de los flujos anteriores (divisiones, asistencia y delegación) no se sustituyen por esta prueba específica de fotos.

## Mensajes de validación del backend

Las respuestas 422 conservan `code: VALIDATION` y `fields`, y ahora incluyen un mensaje detallado en español y `errors` con rutas de campo. El frontend muestra todos los detalles, admite las respuestas del API anterior y conserva los mensajes de reglas de negocio. Los valores enviados, incluidas las contraseñas, no se incorporan al mensaje.

Se corrigieron las ayudas de usuarios y equipos para indicar 12 caracteres, el mínimo real del servidor. Una contraseña no vacía pero incompleta puede enviarse para recibir el motivo de validación. El cambio de contraseña administrativo conserva el error bajo el campo hasta que se edite o se vuelva a intentar.

Backend typecheck y frontend build: PASS. Vite requirió ejecución fuera de la restricción de lectura del sandbox; compiló sin errores, con el aviso existente de chunks grandes. `validation-errors.test.ts`: PASS, 2 pruebas (HTTP 422 para contraseña corta de usuario/delegado, campos obligatorios, múltiples errores, mensajes personalizados y campos anidados). `api-errors.test.ts`: PASS, 2 pruebas (detalles completos, compatibilidad, errores de negocio, conexión y fallback). Se repitieron las 11 pruebas de fotos y delegación: PASS. La inspección visual sigue pendiente por falta de navegador habilitado.
