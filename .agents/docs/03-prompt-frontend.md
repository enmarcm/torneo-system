# PROMPT — FRONTEND (resumen ejecutivo)

> **Para MiniMax 4.3.** Documento de referencia. El código literal completo está en `apps/frontend/`. Estilo "EventApp": claro por defecto, sidebar navy con pastilla activa, tarjetas radius 12, hero oscuro, framer-motion.

## Principios
1. **Aire** (padding 24, gap 8/16/24/32).
2. **Jerarquía** (h1 30, h2 24, h3 20, h4 17, body 14-15, caption 12).
3. **Tarjetas** (radius 12, sombra suave, hover sutil).
4. **Color con intención** (azul = acción, grises = secundario, semánticos = estado).
5. **Estados siempre** (loading/empty/error en cada vista).
6. **Movimiento sutil** (150-250ms, framer-motion, respeta `prefers-reduced-motion`).
7. **Consistencia** (mismo botón, input, chip en toda la app).
8. **Microcopy humano en español.**

## Tokens
- **Claro**: primary `#034292`, accent `#FF8A4C`, sidebar `#1B2237`, bg `#F4F6FB`, surface `#FFFFFF`, border `#E6E9F2`, text `#1A2138`, live `#FF3B53`, heroGradient navy.
- **Oscuro**: primary `#3B82F6`, sidebar `#11172A`, bg `#0F1525`, surface `#1A2236`.
- Tipografía: **Plus Jakarta Sans** + **Inter**.

## Estructura
```
src/
├── api/          (axios singleton + métodos por dominio)
├── store/        (zustand: useAuthStore, useGlobalStore)
├── lib/          (queryClient, socket, dayjs)
├── theme/        (tokens + theme MUI)
├── routes/       (ROUTES, RoleGuard, AppRouter)
├── components/
│   ├── layout/   (Sidebar, Topbar, AdminLayout, TeamLayout, PublicLayout, PageHeader)
│   ├── ui/       (StatusBadge, StatCard, PersonRow, Loading/Empty/ErrorState, DataTable, AppModal, AppDrawer, ConfirmDialog, FormInput/Select/DatePicker, SearchInput)
│   └── sport/    (EntityHeroCard, MatchFormLayout, RosterPullout, StandingsTable, LiveScoreboard, KnockoutBracket, GroupCard, MatchCard, FixtureRow)
├── hooks/        (queries, mutations, common, ui)
├── pages/
│   ├── admin/    (Login + 9 páginas + detail pages)
│   ├── team/     (Home, Squads, Stats, History, Transfers)
│   └── public/   (Home, Competitions, Stats, Teams, Schedule, Live, History)
└── utils/        (formatDate, statusLabels, etc.)
```

## Reglas
- Theme central, cero colores sueltos.
- Cero magic strings (usa `ROUTES`).
- Axios singleton + TanStack Query (sin `fetch` suelto).
- RHF + Zod en formularios.
- Animaciones 150-250ms, `prefers-reduced-motion`.
- Mobile-first, accesibilidad básica.
- **Sin pagos.**
- `tsc --noEmit` limpio.

Para el código literal completo, ver archivos en `apps/frontend/`.
