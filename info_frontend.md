# Frontend — Liga Lago Futsal (LLF)

## Arquitectura general

| Capa | Tecnología |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Ruteo | React Router v6 (nested layout routes, lazy loading) |
| Estado global | Zustand + persist (2 stores: `useAuthStore`, `useGlobalStore`) |
| Data fetching | TanStack React Query (queries + mutations separados) |
| HTTP | Axios singleton con interceptors JWT + refresh |
| UI | MUI v5 + framer-motion + `@mui/x-charts` |
| Formularios | React Hook Form + Zod |
| Auth | JWT access/refresh rotation, RBAC (ADMIN / TEAM_LEADER) |
| API Backend | `http://localhost:7391/api` |
| Puertos | Frontend 5842, Backend 7391, Postgres 8217, MinIO 6773/6774, Adminer 8123 |

---

## Roles y guards

### Archivos clave
- `src/routes/RoleGuard.tsx` — `RoleGuard` (verifica rol permitido) y `PublicOnly` (redirige logueados)
- `src/routes/AppRouter.tsx` — Layouts anidados con guards
- `src/routes/routes.ts` — Constantes `ROUTES`

### Flujo de autenticación
1. Login (`/login`) → `PublicOnly` guard (si ya hay sesión, redirige a su home)
2. `useLoginMutation` → JWT access token + refresh token → `useAuthStore.setSession()`
3. Redirect según rol: ADMIN → `/admin`, TEAM_LEADER → `/equipo`
4. Logout → `useAuthStore.logout()` → redirect a `/login`

### Guards
```tsx
<Route element={<RoleGuard allow={['ADMIN']} />}>   → solo ADMIN
<Route element={<RoleGuard allow={['TEAM_LEADER']} />}> → solo TEAM_LEADER
<Route element={<PublicOnly />}> → solo usuarios NO logueados
```

Los guards envuelven `<Outlet />` como layout-route. Si no hay usuario → redirect a `/login`. Si el rol no está permitido → redirect a `/login`.

---

## Layouts

### AdminLayout (`src/components/layout/AdminLayout.tsx`)
- Desktop: `Sidebar` fijo + `Topbar` + contenido con Suspense
- Mobile: `Sidebar` dentro de `Drawer` overlay (controlado por hamburger)
- `ml` dinámico: `sidebarCollapsed ? 64 : 264` px (desktop)

### TeamLayout (`src/components/layout/TeamLayout.tsx`)
- Ídem AdminLayout pero con `TeamSidebar`

### PublicLayout
- Sin sidebar, AppBar + footer

---

## Sidebar — Estado actual

### Sidebar.tsx (Admin) / TeamSidebar.tsx (Team)
- **Desktop** (`md+`): Siempre visible. `sidebarCollapsed` controla width 64↔264px con `motion.div` (150ms).
  - Expandido: íconos + labels + modo oscuro + avatar + cerrar sesión
  - Colapsado: solo íconos (tooltip al hover) — **NO** muestra cerrar sesión ni modo oscuro ni avatar
- **Mobile** (`<md`): Se renderiza plano (sin `motion.div`) y se coloca dentro de un `<Drawer>` del layout
  - El Drawer se abre/cierra con hamburger del Topbar (estado `mobileOpen` local en el layout)
  - Cuando se abre, el sidebar se muestra COMPLETO (expandido, 264px, con labels y opciones)
  - **Problema**: El sidebar siempre se renderiza con el width del store (`sidebarCollapsed`), no como "expandido forzado" en mobile. Esto causa que en mobile se vea colapsado (64px).

### Topbar.tsx
- Hamburger: en mobile llama `onOpenSidebar()` (abre Drawer), en desktop llama `toggleSidebar()` (colapsa)
- Saludo + fecha + selector de edición + modo oscuro + notificaciones + avatar (menú desplegable con cerrar sesión)

---

## 1. PERFIL ADMIN

**Ruta base:** `/admin`  
**Layout:** `AdminLayout.tsx` (Sidebar + Topbar)  
**Ingreso:** `admin@torneo.com`

### Sidebar Admin (10 ítems de navegación)

| # | Vista | Ruta | Descripción |
|---|---|---|---|
| 1 | Dashboard | `/admin` | Resumen global: StatCards (equipos, jugadores, partidos, pendientes), edición activa, partidos recientes, tabla de posiciones |
| 2 | Ediciones | `/admin/ediciones` | CRUD completo. Grid de cards con nombre, temporada, año, badge estado, toggle transfers. Drawer crear/editar. Menu contextual cambiar estado |
| 3 | Edición detalle | `/admin/ediciones/:id` | Detalle de una edición: StatCards, chips información, grid de competiciones inscritas (click → detalle competición) |
| 4 | Categorías | `/admin/categorias` | CRUD completo. DataTable: nombre, formato, rango edad, eligibilidad, min/max players, activo. Drawer crear/editar |
| 5 | Competiciones | `/admin/competiciones` | CRUD completo. Grid de cards: nombre, categoría, formato, estado, conteo equipos/partidos. Filtro por edición. Drawer crear |
| 6 | Competición detalle | `/admin/competiciones/:id` | Detalle: chips (estado, división, edad, cupo), StatCards, StandingsTable, MatchCards |
| 7 | Equipos | `/admin/equipos` | CRUD. DataTable: avatar+nombre, leader email, registros, badge estado. Filtros: status/categoría/search. Drawer crear. Acciones: inscribir en competición, activar/desactivar |
| 8 | Equipo detalle | `/admin/equipos/:id` | StatCards, MatchCards filtrados, info del equipo |
| 9 | Jugadores | `/admin/jugadores` | CRUD. DataTable: avatar+nombre+posición, documento, edad, badge verificación título, badge estado. Search con debounce. Drawer crear. Acciones: verificar título, activar/desactivar |
| 10 | Jugador detalle | `/admin/jugadores/:id` | Información personal + chips + StatCards + lista de competiciones en las que participa |
| 11 | Programación | `/admin/programacion` | CRUD partidos. Selector competición, navegación por días (flechas + date picker). MatchCards por día. Drawer crear partido. Botones Iniciar/Finalizar partido + agregar eventos (goles) en vivo |
| 12 | Partido detalle | `/admin/partidos/:id` | LiveScoreboard grande + timeline de eventos del partido |
| 13 | Estadísticas | `/admin/estadisticas` | Filtro competición. StatCards globales (jugadores, goles, asistencias, tarjetas). BarChart top goleadores. DataTables: top 10 goles / asistencias / tarjetas |
| 14 | Publicidad | `/admin/publicidad` | CRUD ads. DataTable: thumbnail imagen, ubicación, orden, activo. Drawer crear/editar (imagen URL, link URL, ubicación, orden) |
| 15 | Auditoría | `/admin/auditoria` | Filtro tipo entidad (User, Edition, Category...). Timeline de logs: timestamp, acción chip, entidad chip, user ID |

### Operaciones CRUD completas (Admin)

| Módulo | Crear | Leer | Editar | Eliminar | Acciones especiales |
|---|---|---|---|---|---|
| Ediciones | ✅ Drawer | ✅ Grid cards | ✅ Drawer | ❌ | Cambiar estado (DRAFT→ACTIVE→FINISHED), toggle transfers |
| Categorías | ✅ Drawer | ✅ DataTable | ✅ Drawer | ✅ ConfirmDialog | Toggle activo/inactivo |
| Competiciones | ✅ Drawer | ✅ Grid cards | ❌ (no implementado) | ❌ | Cambiar estado, filtro por edición |
| Equipos | ✅ Drawer | ✅ DataTable | ❌ | ❌ | Inscribir en competición, activar/desactivar |
| Jugadores | ✅ Drawer | ✅ DataTable | ✅ Drawer | ❌ | Verificar título, activar/desactivar |
| Partidos | ✅ Drawer | ✅ Cards/día | ✅ (no detalle) | ❌ | Iniciar/Finalizar, agregar eventos gol |
| Publicidad | ✅ Drawer | ✅ DataTable | ✅ Drawer | ✅ ConfirmDialog | Toggle activo/inactivo |
| Auditoría | ❌ | ✅ Timeline | ❌ | ❌ | Filtro por entidad |

### Validaciones (Admin)
- **Zod en TODOS los formularios** (react-hook-form + zodResolver)
- Ediciones: nombre requerido, temporada/año range, fechas validación
- Categorías: nombre requerido, formato enum, edad min/max, jugadores min/max
- Competiciones: nombre, categoría requerida, formato, edad, cupo
- Equipos: nombre requerido
- Jugadores: nombre, apellido, documento requeridos, email válido, fecha nacimiento
- Partidos: competición, equipo local/visitante, fecha

---

## 2. PERFIL TEAM LEADER (Líder de equipo)

**Ruta base:** `/equipo`  
**Layout:** `TeamLayout.tsx` (TeamSidebar + Topbar)  
**Ingreso demo:** `aguilas@torneo.com` / `Team1234`  
**Restricción:** Solo ve/opera sobre su propio equipo (`user.teamId`)

### Sidebar Team (7 ítems)

| # | Vista | Ruta | Descripción |
|---|---|---|---|
| 1 | Inicio | `/equipo` | Hero "Tu equipo", StatCards (inscripciones, partidos), card Rendimiento (V/E/D/P), MatchCards próximos partidos |
| 2 | Jugadores | `/equipo/jugadores` | CRUD jugadores del equipo. DataTable por competición, StatCards, toggle Lista/Por competición. Drawer crear/editar. Modal detalle con stats. Toggle activo/inactivo |
| 3 | Plantillas | `/equipo/plantillas` | Ver plantillas por competición. Agregar jugador a plantilla (modal: seleccionar competición + jugador + número camiseta) |
| 4 | Partidos | `/equipo/partidos` | Filtro competición + estado. Grid de MatchCards del equipo |
| 5 | Estadísticas | `/equipo/estadisticas` | Filtro competición. StatCards equipo, BarChart top goleadores, PieChart contribución, DataTable stats jugadores (goles, asistencias, tarjetas, minutos). Tabs: goleadores / asistencias / tarjetas |
| 6 | Historial | `/equipo/historial` | Grid de ediciones donde el equipo ha participado. Click → detalle |
| 7 | Historial detalle | `/equipo/historial/:id` | Hero edición, StatCards (competiciones, partidos, wins, goles), Standings por competición, MatchCards agrupados |
| 8 | Traspasos | `/equipo/traspasos` | Selector edición, historial de traspasos del equipo, card advertencia (transfers cerrados/abiertos), modal solicitar traspaso |

### Operaciones Team Leader

| Módulo | Crear | Leer | Editar | Eliminar | Acciones especiales |
|---|---|---|---|---|---|
| Jugadores (del equipo) | ✅ Drawer | ✅ DataTable | ✅ Drawer | ❌ | Toggle activo/inactivo, ver detalle con stats |
| Plantillas | ✅ Agregar | ✅ Por competición | ❌ | ❌ | Asignar número camiseta |
| Traspasos | ✅ Solicitar | ✅ Historial | ❌ | ❌ | Solo si transfers habilitados en la edición |

### Lo que NO puede hacer Team Leader
- ❌ Crear/editar ediciones, categorías, competiciones
- ❌ Ver/operar sobre otros equipos
- ❌ Ver programación completa (solo sus partidos)
- ❌ Ver auditoría
- ❌ Ver/modificar publicidad
- ❌ Ver dashboard global de admin
- ❌ Iniciar/finalizar partidos
- ❌ Modificar estados de ediciones/competiciones

### Validaciones (Team Leader)
- Crear/editar jugador: nombre, apellido, documento requeridos, email, fecha nacimiento
- Agregar a plantilla: competición requerida, jugador requerido, número camiseta opcional
- Solicitar traspaso: jugador, registros origen/destino

---

## 3. PERFIL PÚBLICO (Sin autenticación)

**Ruta base:** `/` (raíz)  
**Layout:** `PublicLayout.tsx` (AppBar simple + footer)  
**Sin login requerido**

| # | Vista | Ruta | Descripción |
|---|---|---|---|
| 1 | Inicio público | `/` | Hero edición activa, "EN VIVO" con dot pulsante, MatchCards próximos, grid competiciones |
| 2 | Competiciones | `/competiciones` | Selector edición + competición, StandingsTable |
| 3 | Calendario | `/calendario` | Selector competición, MatchCards del calendario |
| 4 | En vivo | `/en-vivo` | LiveScoreboard de partidos en vivo |
| 5 | Estadísticas | `/estadisticas` | Top 20 jugadores: posición, avatar, nombre, equipo, goles, partidos |
| 6 | Equipos | `/equipos` | Grid de todos los equipos con avatar, nombre, cantidad registros |

### Lo que NO puede ver el público
- ❌ Detalle de jugadores
- ❌ Detalle de equipos (más allá del nombre y logo)
- ❌ CRUD de nada
- ❌ Historial por equipo
- ❌ Estadísticas detalladas por equipo/jugador

---

## 4. Assets del frontend

**Ubicación:** `apps/frontend/src/assets/`

| Archivo | Tipo | Propósito |
|---|---|---|
| `logo.PNG` | PNG | Logo principal (fondo claro) |
| `logo_azul.PNG` | PNG | Logo versión azul |
| `logo_alterno.jpeg` | JPEG | Logo alternativo |
| `escudo.PNG` | PNG | Escudo/emblema |

Actualmente **no se usan** en ningún componente. Los logos se muestran como iniciales (`L`) en los sidebars. Pendiente integrarlos como imagen real.

---

## 5. Store — Estado global

### `useAuthStore` (persist `torneo-auth`)
```ts
user: AuthUser | null         // { id, email, role, teamId }
accessToken: string | null
setSession(user, token)
setAccessToken(token)
setUser(user)
logout()
```

### `useGlobalStore` (persist `torneo-global`)
```ts
mode: 'light' | 'dark'
sidebarCollapsed: boolean
selectedEditionId: string | null
toggleMode()
setMode(m)
toggleSidebar()
setSelectedEditionId(id)
```

---

## 6. API Hooks disponibles

### Queries (`src/hooks/queries/index.ts`)
| Hook | Endpoint | Descripción |
|---|---|---|
| `useEditionsQuery()` | GET /editions | Todas las ediciones |
| `useEditionQuery(id)` | GET /editions/:id | Una edición |
| `useCategoriesQuery()` | GET /categories | Todas las categorías |
| `useCompetitionsQuery(editionId?)` | GET /competitions?editionId= | Competiciones filtradas |
| `useCompetitionQuery(id)` | GET /competitions/:id | Una competición |
| `useTeamsQuery()` | GET /teams | Todos los equipos |
| `useTeamQuery(id)` | GET /teams/:id | Un equipo |
| `useTeamRegistrationsQuery(teamId?)` | GET /teams/:id/registrations | Inscripciones + roster |
| `usePlayersQuery(search?)` | GET /players?search= | Jugadores (filtrados) |
| `usePlayerQuery(id)` | GET /players/:id | Un jugador |
| `useMatchesQuery(competitionId?, status?)` | GET /matches | Partidos filtrados |
| `useMatchQuery(id)` | GET /matches/:id | Un partido |
| `useStandingsQuery(competitionId, groupId?)` | GET /standings | Tabla posiciones |
| `usePlayerStatsQuery(params?)` | GET /stats/players | Estadísticas jugadores |
| `useTransfersQuery(editionId?)` | GET /transfers | Traspasos |
| `useAdsQuery(placement?)` | GET /ads | Publicidad |
| `useDashboardMetricsQuery(editionId)` | GET /dashboard/metrics | Métricas dashboard |
| `usePublicStatsQuery()` | GET /public/stats | Estadísticas públicas |
| `usePublicAdsQuery()` | GET /public/ads | Ads públicos |
| `usePublicEditionsQuery()` | GET /public/editions | Ediciones públicas |
| `usePublicCompetitionsQuery()` | GET /public/competitions | Competiciones públicas |
| `usePublicTeamsQuery()` | GET /public/teams | Equipos públicos |
| `usePublicPlayersQuery()` | GET /public/players | Jugadores públicos |
| `usePublicMatchesQuery()` | GET /public/matches | Partidos públicos |
| `usePublicStandingsQuery(competitionId)` | GET /public/standings | Posiciones públicas |

### Mutations (`src/hooks/mutations/index.ts`)
| Hook | Operación |
|---|---|
| `useLoginMutation()` | POST /auth/login |
| `useCreateEdition()` | POST /editions |
| `useUpdateEdition()` | PATCH /editions/:id |
| `useSetEditionStatus()` | PATCH /editions/:id/status |
| `useSetTransfers()` | PATCH /editions/:id/transfers |
| `useCreateCategory()` | POST /categories |
| `useUpdateCategory()` | PATCH /categories/:id |
| `useDeleteCategory()` | DELETE /categories/:id |
| `useCreateCompetition()` | POST /competitions |
| `useUpdateCompetition()` | PATCH /competitions/:id |
| `useSetCompetitionStatus()` | PATCH /competitions/:id/status |
| `useCreateTeam()` | POST /teams |
| `useUpdateTeam()` | PATCH /teams/:id |
| `useSetTeamStatus()` | PATCH /teams/:id/status |
| `useRegisterTeam()` | POST /teams/:id/register |
| `useCreatePlayer()` | POST /players |
| `useUpdatePlayer()` | PATCH /players/:id |
| `useSetPlayerStatus()` | PATCH /players/:id/status |
| `useSetPlayerDegree()` | PATCH /players/:id/degree |
| `useAddRoster()` | POST /rosters |
| `useUpdateRoster()` | PATCH /rosters/:id |
| `useSetEligibility()` | PATCH /rosters/:id/eligibility |
| `useRemoveRoster()` | DELETE /rosters/:id |
| `useCreateMatch()` | POST /matches |
| `useUpdateMatch()` | PATCH /matches/:id |
| `useStartMatch()` | PATCH /matches/:id/start |
| `useFinishMatch()` | PATCH /matches/:id/finish |
| `useDeleteMatch()` | DELETE /matches/:id |
| `useCreateMatchEvent()` | POST /matches/:id/events |
| `useCreateTransfer()` | POST /transfers |
| `useSetTransferStatus()` | PATCH /transfers/:id/status |
| `useCreateAd()` | POST /ads |
| `useUpdateAd()` | PATCH /ads/:id |
| `useDeleteAd()` | DELETE /ads/:id |

---

## 7. Componentes compartidos

### UI (`src/components/ui/`)
| Componente | Propósito |
|---|---|
| `AppDrawer` | Drawer lateral para formularios (crear/editar) |
| `AppModal` | Modal genérico |
| `ConfirmDialog` | Diálogo de confirmación para acciones destructivas |
| `DataTable` | Tabla con header sticky, hover, chip estado, menú kebab |
| `EmptyState` | Estado vacío con icono + mensaje |
| `ErrorState` | Estado error con mensaje + reintentar |
| `LoadingState` | Skeleton loading con filas configurables |
| `PageHeader` | Título + subtítulo de página |
| `PersonRow` | Fila con avatar + nombre para listas |
| `StatCard` | Card métrica: icono + número animado + label + tint |
| `StatusBadge` | Badge de estado con color semántico |

### Sport (`src/components/sport/`)
| Componente | Propósito |
|---|---|
| `EntityHeroCard` | Card hero con gradiente para detalle de entidad |
| `LiveScoreboard` | Marcador grande + "EN VIVO" pulsante |
| `MatchCard` | Card compacta de partido |
| `StandingsTable` | Tabla de posiciones con zonas |

---

## 8. Sidebar — Problemas identificados

### Problema 1: Cerrar sesión no se colapsa
Al colapsar sidebar (64px), el bloque de avatar + email + logout desaparece completamente. Debería:
- Mostrar solo el icono de logout con tooltip (íntegrado en la navegación)
- El avatar y modo oscuro también deberían compactarse a iconos

### Problema 2: Mobile no oculta bien
El sidebar en mobile se renderiza con el width del store (`sidebarCollapsed`), debería forzarse a expandido (264px) dentro del Drawer. Mejor aún: en mobile debería ocultarse completamente y solo mostrar el Drawer overlay cuando se toca el hamburger.

### Problema 3: Drawer no se cierra al navegar
Cuando se navega a una nueva ruta desde el Drawer en mobile, el Drawer debería cerrarse automáticamente.

### Solución propuesta
1. **Siempre renderizar expandido en mobile** (forzar `expanded = true` dentro del Drawer)
2. **Colapsar logout a icono** en modo colapsado (integrar en la lista de navegación o como icono independiente)
3. **Cerrar Drawer al navegar** (onClick → navigate + closeDrawer)

---

## 9. Theme tokens

**Archivo:** `src/theme/tokens.ts`

| Token | Claro | Oscuro |
|---|---|---|
| primary | `#034292` | `#3B82F6` |
| accent | `#FF8A4C` | `#FF8A4C` |
| sidebar | `#1B2237` | `#11172A` |
| bg | `#F4F6FB` | `#0F1525` |
| surface | `#FFFFFF` | `#1A2236` |
| border | `#E6E9F2` | — |
| text | `#1A2138` | — |
| live | `#FF3B53` | — |

### Tipografía
- **Plus Jakarta Sans**: títulos, números, botones
- **Inter**: cuerpo

### Escala
h1: 30 / h2: 24 / h3: 20 / h4: 17 / body: 14-15 / caption: 12

### Radios
- Tarjetas: 12 → EntityHeroCard: ahora 2 (antes 6/24)
- Input/botón: 10
- Chip: 999
- Sidebar ítem: 12 (expandido) / 8 (colapsado)

---

## 10. Próximos pasos y mejoras pendientes

### Sidebar
- [ ] Modo colapsado: incluir icono logout + modo oscuro + avatar en la barra compacta
- [ ] Mobile: forzar expandido (264px) dentro del Drawer
- [ ] Mobile: cerrar Drawer al navegar
- [ ] Evaluar cambiar a overlay fijo que tape todo el contenido (sin margin-left)

### Features faltantes
- [ ] Admin: editar competición (falta drawer/form)
- [ ] Admin: editar equipo
- [ ] Detalle de cada elemento con modal informativo completo
- [ ] Animaciones de estadísticas (contadores, barras animadas) en todas las vistas
- [ ] Integrar assets de logo (PNG/JPEG) en Sidebar y login
- [ ] Breadcrumbs de navegación
- [ ] Notificaciones en tiempo real (Socket.io)
- [ ] Filtro global por edición en todas las vistas

### Responsive
- [ ] Revisar grids en mobile (algunas vistas tienen columnas fijas que no adaptan)
- [ ] MatchCard: adaptar a mobile (reducir padding, fuente)
- [ ] DataTable: implementar vista tipo cards en mobile

### Backend pendiente
- [ ] Endpoint de historial por equipo
- [ ] Endpoint de estadísticas agregadas por equipo
- [ ] Endpoint de jugadores del equipo (simplificado)
