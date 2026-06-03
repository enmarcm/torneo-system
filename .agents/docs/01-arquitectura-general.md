# Arquitectura General + Infraestructura (código literal)

**Versión:** 4.0 · **Fuente de verdad.** El backend y el frontend deben usar EXACTAMENTE este modelo de datos, este `docker-compose.yml` y este `.env.example`. No inventar nombres ni campos distintos.

---

## 1. Resumen del dominio
- **Edition**: torneo 3 veces/año. Controla apertura de traspasos.
- **Category**: catálogo CRUD (Sub-15, Primera, Gremial, Master, Copa…). El admin agrega más. Hay defaults sembrados.
- **Competition**: una `Category` instanciada en una `Edition`. Aquí se juega. Formato `LEAGUE` o `GROUPS_KNOCKOUT`.
- **Team**: se inscribe en varias competiciones (`TeamRegistration`); cada inscripción tiene su **plantilla** propia (`RosterEntry`).
- **Player**: registro único por documento. Puede jugar varias competiciones.
- Elegibilidad: por edad (`ageMin/ageMax`) y/o por habilitación del admin (`requiresAdminEligibility` → `RosterEntry.eligibilityApproved`).
- **Match** con eventos (`MatchEvent`) y partidos en vivo por **Socket.io**.
- Imágenes en **MinIO**. **No existe módulo de pagos.**

## 2. Estructura del monorepo
```
torneo-system/
├── docker-compose.yml
├── .env.example
├── package.json (workspaces)
├── README.md
├── packages/shared/
└── apps/
    ├── backend/
    └── frontend/
```

## 3. Categorías por defecto (seed)
- Sub-12, Sub-15, Sub-17, Primera, Segunda, Tercera, Gremial, Master, Copa de la Liga (GROUPS_KNOCKOUT).

## 4. Reglas de negocio
1. **Elegibilidad al rostear:** edad (Caracas TZ) + `eligibilityApproved` si `requiresAdminEligibility`. Cupo `min/max`.
2. **LEAGUE:** todos contra todos → standings → eliminatoria de los primeros `knockoutQualifiers` (8/16).
3. **GROUPS_KNOCKOUT:** `numGroups` × `groupSize` → `qualifiersPerGroup` → eliminatoria.
4. **Standings:** V=3, E=1, D=0. Orden: Pts → DG → GF.
5. **Vivo:** al crear `MatchEvent`, actualizar marcador y emitir socket a `match:{id}`. Al `finish`, consolidar `PlayerSeasonStats`.
6. **Traspasos:** solo si `edition.transfersOpen` y dentro de ventana.

## 5. Diseño (tokens)
- Estilo EventApp: tema claro por defecto, **sidebar navy** con pastilla blanca en activo, tarjetas redondeadas (radius 18) con sombra suave, tarjetas "hero" oscuras.
- Primario `#4361EE`, acento `#FF8A4C`, sidebar `#1B2237`, fondo `#F4F6FB`, superficie `#FFFFFF`, en vivo `#FF3B53`. Oscuro disponible.
- Tipografía: **Plus Jakarta Sans** (títulos/números) + **Inter** (texto). Mobile-first, framer-motion.

Para el schema.prisma, docker-compose.yml y .env.example exactos, ver archivos `02-prompt-backend.md` (sección 4 y 7) y `01-arquitectura-general.md` original. Los archivos raíz se mantienen versionados en este proyecto.
