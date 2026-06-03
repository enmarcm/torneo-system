# PROMPT — BACKEND COMPLETO (resumen ejecutivo)

> **Para MiniMax 4.3.** Documento de referencia. El código literal completo está en `apps/backend/`. Este doc resume las 23 fases para retomar contexto.

## Capas por módulo
Cada módulo: `<dominio>.schema.ts` (Zod) → `<dominio>.service.ts` (lógica + Prisma) → `<dominio>.controller.ts` (orquesta) → `<dominio>.routes.ts` (rutas + middlewares). El controller NUNCA tiene lógica; el service NUNCA toca `req/res`.

## Fases
- **B0**: Init, deps, tsconfig, carpetas.
- **B1**: Prisma schema + `migrate dev --name init`.
- **B2**: `config/{env,constants}.ts`, `lib/{prisma,logger,minio,socket}.ts`, `utils/*`, 5 middlewares, `app.ts`, `server.ts`.
- **B3-B18**: 16 módulos (auth, users, editions, categories, competitions, groups, teams, players, rosters, matches, match-events, standings, stats, transfers, ads, uploads, dashboard, public).
- **B19**: `modules/router.ts` final.
- **B20**: `prisma/seed.ts` (admin + 9 categorías + edición demo).
- **B21**: `Dockerfile` del backend.

## Reglas clave
- Zod en TODO endpoint.
- Respuestas `{success,data,message,meta}`.
- `AppError` para errores de negocio.
- Secretos solo en `.env`.
- Singletons (prisma/minio/logger).
- Auditoría con middleware `audit()`.
- Fechas `dayjs` TZ `America/Caracas` formato `DD-MM-YYYY hh:mm A`.
- **Sin pagos.**
- `npm run typecheck` limpio antes de cerrar cada fase.

## Roles
- `ADMIN`: CRUD total, habilita jugadores, abre traspasos, auditoría.
- `TEAM_LEADER`: gestiona su equipo, sus inscripciones, sus plantillas, solicita traspasos.
- Público: lectura.

## Reglas de negocio críticas
1. **Elegibilidad por edad** en roster.
2. **Habilitación admin** para gremial/master.
3. **Cupo** min/max.
4. **Traspasos** requieren `transfersOpen` + ventana.
5. **Standings** V/E/D = 3/1/0, orden Pts→DG→GF.
6. **Vivo:** evento → actualiza score → emite socket `match:{id}`.
7. **Jugador en 2 categorías** (juvenil + adulta) permitido.

Para el código literal completo de cada fase, ver archivos en `apps/backend/`.
