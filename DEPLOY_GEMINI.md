# Despliegue en VPS — Guía para Gemini

## Stack

- **Backend:** Express + TypeScript + Prisma ORM
- **Frontend:** React + Vite + MUI (build estático servido por nginx)
- **Base de datos:** PostgreSQL 16
- **Object Storage:** MinIO (S3-compatible)
- **Orquestación:** Docker Compose (5 servicios)

## Estructura del proyecto

```
torneo-system/
├── apps/
│   ├── backend/          # Express API + Prisma
│   │   ├── prisma/       # Schema + seed + migrations
│   │   └── src/
│   │       ├── config/    # env.ts (Zod schema de .env)
│   │       ├── lib/       # prisma, minio, socket, logger
│   │       ├── middlewares/ # auth, role, validate, audit, error
│   │       ├── modules/   # 16 módulos (auth, users, teams, etc.)
│   │       └── utils/     # http, password, pagination, date
│   ├── frontend/          # React SPA con nginx
│   │   ├── src/
│   │   │   ├── api/       # Axios singleton + 10 apis
│   │   │   ├── components/ # layout, ui, sport
│   │   │   ├── hooks/     # TanStack Query (queries + mutations)
│   │   │   ├── pages/     # 21 páginas (admin, auth, public, team)
│   │   │   ├── routes/    # AppRouter lazy + RoleGuard
│   │   │   ├── store/     # Zustand (auth, global)
│   │   │   └── theme/     # tokens.ts + MUI theme
│   │   └── nginx.conf     # SPA fallback + gzip
│   └── backend/ & frontend/ Dockerfiles
├── packages/shared/        # Enums, types, Zod schemas compartidos
├── docker-compose.yml      # 5 servicios
└── .env                    # Variables de entorno
```

## Arquitectura de puertos

| Servicio | Puerto interno | Puerto host |
|----------|---------------|-------------|
| PostgreSQL | 5432 | 8217 |
| MinIO API | 9000 | 6773 |
| MinIO Console | 9001 | 6774 |
| Backend API | 4000 | 7391 |
| Frontend (nginx) | 80 | 5842 |
| Adminer | 8080 | 8123 |

**Importante:** Los servicios dentro de Docker se comunican por puertos internos. Solo los puertos host se exponen al exterior.

## .env (variables clave — NO subir al repo, generar con `openssl rand -hex 24`)

```bash
# Ejemplo de cómo debe verse el .env (usar valores reales solo localmente)
POSTGRES_PASSWORD=cambia_esta_clave
DATABASE_URL=postgresql://torneo:$POSTGRES_PASSWORD@postgres:5432/torneo_db?schema=public
JWT_ACCESS_SECRET=pon_un_secreto_largo_aleatorio_1
JWT_REFRESH_SECRET=pon_un_secreto_largo_aleatorio_2
ADMIN_EMAIL=admin@torneo.com
ADMIN_PASSWORD=Admin1234
MINIO_ROOT_PASSWORD=minioadmin123
```

## Configuración de nginx (frontend)

El frontend es una SPA. El `nginx.conf` redirige todo a `index.html` para client-side routing:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Las variables de entorno del frontend (`VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_PUBLIC_ASSETS_URL`) se inyectan en **build-time** a través de `docker build --build-arg`.

## Despliegue en VPS

```bash
# 1. Clonar
git clone https://github.com/enmarcm/torneo-system.git
cd torneo-system

# 2. Configurar .env
cp .env.example .env
nano .env   # Ajustar passwords, secrets, y dominios

# 3. Construir y levantar
docker compose up -d --build

# 4. Verificar
docker compose ps
curl http://localhost:7391/api/health
curl http://localhost:5842
```

## Migraciones y seed

Se ejecutan automáticamente al iniciar el backend:
```bash
npx prisma migrate deploy && npm run prisma:seed
```

Para resetear:
```bash
docker compose exec backend npx prisma migrate reset --force
```

## Consideraciones para producción

1. **NGINX reverse proxy:** Poner Cloudflare o nginx por delante para SSL (certbot).
2. **MinIO público:** El bucket `public-assets` es anónimo (download). Idealmente usar CDN.
3. **CORS:** `CORS_ORIGIN` debe apuntar al dominio del frontend.
4. **JWT:** Rotar secrets periódicamente.
5. **Backups:** Hacer pg_dump periódico del volumen `pgdata`.
6. **Logs:** Docker logs a stdout; configurar rotación con `--log-opt max-size=10m`.
7. **Health check:** `GET /api/health` para monitoring.

## Comandos útiles

```bash
# Ver logs
docker compose logs -f backend
docker compose logs -f frontend

# Ejecutar seed manualmente
docker compose exec backend npm run prisma:seed

# Acceder a la BD
docker compose exec postgres psql -U torneo -d torneo_db

# Ver imagenes en MinIO
# Abrir http://host:6774 (console) con minioadmin / password
```
