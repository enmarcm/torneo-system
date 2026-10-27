# ⚽ Torneo System · Liga Lago Futsal

> Plataforma de gestión de torneos de fútbol sala con marcadores en vivo, tablas de posiciones, calendarios y llaves de competición. **En producción.**

[![Live](https://img.shields.io/badge/demo-torneo.enmarcm.site-22c55e?style=flat-square)](https://torneo.enmarcm.site/)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

🔗 **Demo:** https://torneo.enmarcm.site/

<!-- TODO: capturas reales -->
| Inicio del torneo | Partido en vivo | Panel admin |
|---|---|---|
| ![](docs/screenshots/home.png) | ![](docs/screenshots/live.png) | ![](docs/screenshots/admin.png) |

## ✨ Funcionalidades

- **Ediciones** (3 al año), con varias competiciones por edición:
  - **Liga** de Primera, Segunda y Tercera, ligadas por ascenso y descenso.
  - **Copa de la Liga**: 8 grupos de 4, luego octavos, cuartos, semis y final. Las rondas pueden ser a ida y vuelta.
  - Menores (Sub-12, Sub-15, Sub-17), Gremial y Veteranos.
- **Sorteo automático** de cruces (liga o grupos). Luego el admin programa fecha y hora.
- **Marcadores en vivo** por Socket.IO.
- **Tabla de posiciones**: puntos, luego enfrentamiento directo, luego DG, luego GF.
- Equipos con historial completo. Nunca se borran: se desactivan o se bloquean.
- Jugador único por documento, inscrito en varias competiciones.
- Ascensos, descensos y bajas decididos por el admin, equipo por equipo.
- Subida de archivos (escudos y fotos) a MinIO.

## 🛠️ Stack

| Capa | Tecnologías |
|---|---|
| Frontend | Vite, React 18, TypeScript, MUI v6, TanStack Query, Zustand, React Hook Form, Zod, framer-motion |
| Backend | Node 20, Express, Prisma, PostgreSQL 16, Socket.io, JWT, argon2, Zod, Winston |
| Infra | Docker Compose, MinIO, Adminer |

Monorepo: `apps/backend` (API REST + Socket.io), `apps/frontend` (UI) y `packages/shared` (enums y tipos compartidos).

## 🚀 Puesta en marcha

```bash
cp .env.example .env      # edita los secretos
docker compose up -d --build
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5842 |
| API | http://localhost:7391/api |
| Health | http://localhost:7391/api/health |
| Adminer | http://localhost:8123 |
| MinIO Console | http://localhost:6774 |

Sin Docker:

```bash
cd apps/backend && cp ../../.env.example .env && npm install
npx prisma migrate dev && npm run prisma:seed && npm run dev
# en otra terminal
cd apps/frontend && npm install && npm run dev
```

## 👥 Autores

**Enmanuel Colina** ([@enmarcm](https://github.com/enmarcm) · [enmarcm.site](https://enmarcm.site)) y **Royer Merchan**.

---

🇬🇧 *Futsal tournament management platform (live in production): editions, leagues with promotion and relegation, cups with groups and knockouts, live scores over Socket.IO, and standings with head-to-head tiebreakers. Stack: React + MUI, Express + Prisma + PostgreSQL, Docker.*
