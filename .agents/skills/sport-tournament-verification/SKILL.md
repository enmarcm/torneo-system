---
name: sport-tournament-verification
version: 1.0
description: "Verificación y QA del Sistema de Torneos. Procedimiento estricto para verificar que TODO compila, conecta y funciona antes de dar por terminado."
author: "General"
tags: [qa, testing, verificacion, build, docker, smoke-test, checklist]
---

# Skill de Verificación y QA — Sistema de Torneos

> La ejecuta MiniMax 4.3 al final de cada fase y antes de entregar. No declares "listo" sin pasar esta skill. Ejecuta comandos REALES y registra el resultado. Si falla, **arréglalo y vuelve a verificar** (no avances).

## 0. Cómo usar
1. Por capas: compila → levanta → prueba endpoints → prueba UI.
2. Cada sección tiene comandos y criterio PASS. Marca PASS solo si el criterio se cumple.

## 1. Compilación (estática)
**Backend**
```bash
cd apps/backend && npm run typecheck
```
**Frontend**
```bash
cd apps/frontend && npm run build
```
**Shared**
```bash
cd packages/shared && npx tsc --noEmit
```
**Criterio:** sin errores.

## 2. Reglas duras (grep)
```bash
# 1) Nada de pagos
grep -rniE "payment|pago|paymentmethod|checkout" apps/ --include=*.ts --include=*.tsx | grep -vi "// "
# 2) Sin secretos hardcodeados
grep -rniE "(secret|password|apikey|api_key)\s*[:=]\s*['\"]" apps/ --include=*.ts --include=*.tsx | grep -v "process.env" | grep -v "import.meta.env"
# 3) Sin colores hex sueltos
grep -rniE "#[0-9a-f]{6}" apps/frontend/src/pages apps/frontend/src/components --include=*.tsx | grep -v "tokens.ts"
# 4) Sin fetch suelto
grep -rni "fetch(" apps/frontend/src --include=*.ts --include=*.tsx
# 5) Sin URLs hardcodeadas
grep -rniE "http://localhost|https?://[a-z0-9.]+/api" apps/ --include=*.ts --include=*.tsx | grep -v ".env" | grep -v "import.meta.env"
```
**Criterio:** los 5 imprimen "OK ...".

## 3. Levantar entorno (Docker)
```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
docker compose logs backend --tail=50
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run prisma:seed
```
**Criterio:** 5 servicios running/healthy; admin + 9 categorías.

## 4. Smoke test API
- `POST /api/auth/login` con admin.
- `GET /api/categories` → 9 resultados.
- `POST /api/editions` (admin).
- `GET /api/public/editions` (sin token).
- Probar al menos un endpoint de **cada módulo** (15).

## 5. Reglas de negocio (7 puntos)
1. **Edad:** jugador fuera de rango → 422.
2. **Habilitación admin:** gremial/master sin `eligibilityApproved` → bloqueado.
3. **Cupo:** superar `maxPlayers` → rechaza.
4. **Traspasos cerrados:** `transfersOpen=false` → rechaza.
5. **Standings:** finalizado → 3/1/0 correcto, orden Pts→DG→GF.
6. **Vivo:** gol en LIVE → evento por socket.
7. **Jugador en 2 categorías:** mismo documento en juvenil + adulta.

## 6. UI por pantalla
Para cada pantalla: carga, datos reales, empty, loading, error, diseño, responsive, tema, animación.

## 7. CRUD conectado
Para cada entidad: crear aparece, leer correcto, editar refleja, activar/desactivar funciona.

## 8. Tiempo real
Mismo partido en 2 pestañas: gol en admin actualiza público sin recargar.

## 9. Reporte de verificación
```md
### Reporte — [fecha]
1. Compilación backend: PASS/FAIL
2. Compilación frontend: PASS/FAIL
3. Reglas duras (grep x5): PASS/FAIL
4. Docker arriba: PASS/FAIL
5. Migración + seed: PASS/FAIL
6. Smoke test API: PASS/FAIL
7. Reglas de negocio (7): PASS/FAIL
8. UI por pantalla: PASS/FAIL
9. CRUD conectado: PASS/FAIL
10. Tiempo real: PASS/FAIL
RESULTADO GLOBAL: PASS/FAIL
Pendientes: ...
```

**No entregues si el resultado global no es PASS.**
