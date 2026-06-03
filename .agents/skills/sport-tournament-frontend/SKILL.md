---
name: sport-tournament-frontend
version: 5.0
description: "Sports Tournament — UI/UX First Full-Stack Skill. Sistema de diseño estilo EventApp + reglas full-stack para construir el sistema de torneos de fútbol (Vite+React+MUI+TanStack+Express+Prisma+PostgreSQL+Socket.io+MinIO)."
author: "General"
tags: [ui, ux, design-system, react, mui, typescript, express, prisma, postgresql, zod, tanstack, zustand, docker, sports]
---

# Sports Tournament — UI/UX First Full-Stack Skill

> Para MiniMax 4.3: criterio de UI/UX escrito al detalle. Si dudas, sigue lo escrito. Documentos hermanos: `01-arquitectura-general`, `02-prompt-backend`, `03-prompt-frontend` y la skill `sport-tournament-verification`.

## 0. Regla de oro
Todo debe **compilar, conectar y verse bien**. Una vista sin estados (loading/empty/error), un color suelto, o una pantalla apretada/fea = no terminado. Antes de cerrar: `tsc --noEmit` y la skill de verificación.

## 1. Restricciones de dominio
- **SIN módulo de pagos.** No crees nada de pagos.
- **Categorías = CRUD** en BD con defaults sembrados.
- **Equipo = club**; se inscribe en varias competiciones; cada inscripción tiene su plantilla.

---

# PARTE A — UI/UX (lo más importante)

## 2. Estética objetivo (referencia "EventApp")
Tema claro por defecto, **sidebar navy** con ítem activo en **pastilla blanca**, contenido sobre fondo gris claro, **tarjetas blancas redondeadas (radius 18) con sombra suave**, avatares circulares, **chips de estado**, y **tarjetas "hero" oscuras** para el detalle.

## 3. Tokens de color
**CLARO**: primary `#4361EE`, accent `#FF8A4C`, sidebar `#1B2237`, bg `#F4F6FB`, surface `#FFFFFF`, border `#E6E9F2`, text `#1A2138`, live `#FF3B53`, heroGradient navy.
**OSCuro**: primary `#5B72F2`, sidebar `#11172A`, bg `#0F1525`, surface `#1A2236`.
**Regla**: ningún `#hex` suelto en componentes. Todo sale de `theme/tokens.ts`.

## 4. Tipografía
- **Plus Jakarta Sans** (títulos, números, botones) + **Inter** (texto).
- Escala: h1 30 / h2 24 / h3 20 / h4 17 / body 14-15 / caption 12. Números con `tabular-nums`.

## 5. Medidas, forma, sombra, movimiento
- Radios: tarjeta 18, input/botón 12, chip 999, hero 24.
- Espaciado base 8 (8/16/24/32). **Padding de tarjeta: 24.**
- Sombras (claro): reposo `0 4px 16px rgba(27,34,55,.06)`, hover `0 10px 28px rgba(27,34,55,.10)`, botón primario `0 6px 16px rgba(67,97,238,.25)`.
- Animaciones 150-250ms con framer-motion; respeta `prefers-reduced-motion`.

## 6. Principios de UX
1. Aire. 2. Jerarquía. 3. Tarjetas, no listas planas. 4. Estados siempre. 5. Color con intención. 6. Estado con texto + color (chip). 7. Microcopy humano en español. 8. Confirmar acciones destructivas. 9. Feedback inmediato. 10. Accesibilidad básica.

## 7. Patrones de componente obligatorios
- **Sidebar** navy, ítems ícono+label, **activo = pastilla blanca**, colapsable a 80px.
- **Topbar** 72px: saludo + fecha + buscador + selector de edición + tema + campana + avatar.
- **StatCard**: ícono en chip de color + número grande (tabular) + etiqueta + tendencia.
- **DataTable**: header `surface2` sticky, filas con hover, chip de estado, menú kebab.
- **EntityHeroCard**: tarjeta oscura con `heroGradient` para detalle.
- **RosterPullout**: drawer derecho con `PersonRow`.
- **StandingsTable**: barra de zona verde/roja + leyenda.
- **LiveScoreboard**: marcador grande + "EN VIVO" pulsante + feed animado.
- **KnockoutBracket**, **GroupCard**, **MatchCard**.
- **LoadingState/EmptyState/ErrorState**.
- **FormInput/FormSelect/FormDatePicker** (RHF+Zod).

## 8. Errores de diseño prohibidos
- Elementos diminutos · Tablas desnudas · Fondos negros planos · Botones sin jerarquía · Pantallas sin estados · 5 colores de acento · Inputs sin label · Bordes duros sin radio · Texto en inglés · "Estilo Bootstrap 2013".

---

# PARTE B — Ingeniería

## 9. Arquitectura
Monorepo (`packages/shared` + `apps/backend` + `apps/frontend`), dockerizado. Backend `routes→controller→service→prisma`. Frontend `api→hooks(query/mutation)→pages/components`. Servidor en TanStack Query; global mínimo en Zustand.

## 10. Reglas de código
- Cero hardcodeo, cero magic strings. `ROUTES` para rutas, enums en `shared`.
- Zod en TODA entrada.
- Axios **singleton** + métodos por dominio; nunca `fetch` suelto.
- Hooks: custom hooks reutilizables.
- Respuestas backend `{success,data,message,meta}`; errores con `AppError`.
- Secretos solo en `.env`. Singletons. Borra código muerto.
- Fechas dayjs en `America/Caracas`, `DD-MM-AAAA` 12h.

## 11. Seguridad
JWT access+refresh (rotación), argon2; RBAC; helmet, cors restringido, rate-limit en auth; validar/sanear entrada; nunca exponer `passwordHash`; auditoría.

## 12. Rendimiento
`useMemo/React.memo` donde aporte; lazy-load; paginación en servidor; Prisma con `select/include` precisos; evitar N+1.

## 13. Responsive
Mobile-first; sin overflow; tablas→tarjetas en móvil; sidebar→drawer; tamaño táctil.

## 14. Docker, logs, migraciones
`docker compose up` levanta todo; variables solo en `.env`; Winston+Morgan+`AuditLog`; cada cambio de esquema → migración + nota en `docs/MIGRATIONS.md`.

## 15. Checklist final
- [ ] `tsc --noEmit` y lint OK.
- [ ] `docker compose up` levanta todo; migrate+seed limpios.
- [ ] Todos los CRUD conectados.
- [ ] UI = referencia (claro, sidebar navy con pastilla blanca, tarjetas redondeadas, hero oscuro).
- [ ] Estados loading/vacío/error en cada vista; microcopy humano.
- [ ] Sin colores sueltos, magic strings, hardcodeo, **sin pagos**.
- [ ] Zod en todo; axios singleton + TanStack.
- [ ] Responsive; animaciones suaves; accesibilidad básica.
- [ ] Pasa la skill `sport-tournament-verification`.

## 16. Prompt base
```md
Actúa usando "sport-tournament-frontend" + docs 01/02/03 y verifica con "sport-tournament-verification".
Copia el código literal, replica el módulo/feature X por dominio.
UI estilo EventApp. Reglas: SIN pagos; categorías CRUD; cero colores sueltos/magic strings/hardcodeo; Zod en todo;
estados loading/vacío/error siempre; microcopy humano; responsive; animaciones suaves; seguridad (JWT/RBAC/helmet/cors/rate-limit);
todo en .env. Verifica que TODO compile y cada CRUD quede conectado.
```
