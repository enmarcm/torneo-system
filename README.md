# Torneo System

Sistema de torneos de fútbol: backend Express + Prisma + PostgreSQL, frontend Vite + React + MUI, dockerizado.

Realizado por **Enmanuel Colina** y **Royer Merchan**.

## Stack

- **Backend**: Node 20, Express, Prisma, PostgreSQL 16, Socket.io, MinIO, JWT, argon2, Zod, Winston.
- **Frontend**: Vite, React 18, TypeScript, MUI v6, TanStack Query, Zustand, React Hook Form, Zod, framer-motion, Socket.io client, dayjs.
- **Infra**: Docker Compose, Adminer, MinIO Console.

## Inicio rápido

```bash
cp .env.example .env
# (obligatorio) edita secretos en .env
docker compose up -d --build
```

Servicios expuestos:
- Frontend: http://localhost:5842
- Backend API: http://localhost:7391/api
- Health: http://localhost:7391/api/health
- Adminer (DB): http://localhost:8123
- MinIO API: http://localhost:6773
- MinIO Console: http://localhost:6774

Credenciales admin (seed):
- Email: `admin@torneo.com`
- Password: ver `.env` (generado aleatoriamente)

## Estructura

```
torneo-system/
├── .agents/                 ← Skills + docs persistentes (cargar en cada sesión)
├── packages/shared/         ← Enums y tipos compartidos
├── apps/backend/            ← API REST + Socket.io
└── apps/frontend/           ← UI React + MUI
```

## Desarrollo local sin Docker

```bash
# Backend
cd apps/backend
cp ../../.env.example .env
npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev

# Frontend (otra terminal)
cd apps/frontend
npm install
npm run dev
```

## Documentación interna

- `.agents/docs/01-arquitectura-general.md`
- `.agents/docs/02-prompt-backend.md`
- `.agents/docs/03-prompt-frontend.md`
- `.agents/skills/sport-tournament-frontend/SKILL.md`
- `.agents/skills/sport-tournament-verification/SKILL.md`
- `.agents/skills/dashboard-admin-panel/SKILL.md`
- `PROGRESS.md` y `PROGRESS.json` — bitácora de ejecución.

## Reglas del proyecto

- **Sin módulo de pagos.** No agregar.
- Categorías = CRUD con defaults sembrados.
- Equipo = club; se inscribe en varias competiciones; cada inscripción tiene plantilla.
- Jugador único por documento; puede jugar varias competiciones.
