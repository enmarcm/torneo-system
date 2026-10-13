# Migraciones

## 20261013120000_competitions_without_categories

Las competiciones se crean directamente. Se conservan competiciones, inscripciones, plantillas y partidos. La descripción y las imágenes heredadas se copian antes de quitar la relación. El catálogo anterior queda en `CategoryArchive` para recuperación, sin acceso desde la aplicación.

Aplicar `npm --workspace apps/backend run prisma:deploy` antes de iniciar la nueva versión y regenerar el cliente con `npm --workspace apps/backend run prisma:generate`.

## 20261013130000_competition_age_groups y 20261013130100_competition_sections

Se agrega el apartado persistente Adultos/Menores (`ageGroup`) y el tipo `STANDALONE_LEAGUE` para ligas sin divisiones. El tipo anterior `YOUTH` pasa a Menores; las ligas independientes anteriores pasan a `STANDALONE_LEAGUE` sin tocar inscripciones ni partidos. Los tipos anteriores permanecen compatibles con datos históricos. El nuevo valor de enum se crea en una migración separada antes de usarlo.

Los sistemas de liga ahora se separan por edición y apartado. Una liga sin divisiones no se vincula a ellos ni tiene plazas de ascenso/descenso. Adultos y Menores pueden tener sus propias divisiones.

## 20261013140000_match_attendance

Agrega asistencia por partido e inscripción del jugador en la plantilla (`MatchAttendance`), con estado presente/ausente y fecha de guardado. Los registros son únicos por partido/plantilla y se eliminan en cascada al borrar el partido o la inscripción del jugador. Administrador y anotador pueden consultar/guardar; otros roles no tienen acceso a estos endpoints. Solo se aceptan jugadores de los dos equipos y de la competición del partido. La asistencia anterior se conserva si el jugador deja la plantilla; cambiar los equipos o la competición del partido reinicia la asistencia. No se modifica el cálculo de estadísticas de juego.

## 20261013150000_player_identity_photo

Guarda la clave de la foto del documento en `Player.identityPhotoKey`. Los registros anteriores se conservan; no se inventan imágenes. El API exige foto del jugador y documento al crear, editar o agregar a una plantilla. El documento se sube al bucket privado y solo se sirve mediante el API autenticado a administradores o al delegado del equipo del jugador (y al usuario que acaba de subirlo, antes del alta). No se guarda una URL pública del documento. El formulario permite completar las fotos de registros anteriores.

Verificación local del 13 de octubre de 2026: las 13 migraciones se aplicaron a PostgreSQL nuevo y se ejecutó el seed. No acredita migración de una base histórica ni aplicación en producción.
