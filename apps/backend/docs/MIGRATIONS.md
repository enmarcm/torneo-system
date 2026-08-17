# Migraciones Prisma — Backend

## init (2026-06-03)
- Crea todas las tablas base: `User`, `Edition`, `Category`, `Competition`, `CompetitionGroup`, `Team`, `TeamRegistration`, `Player`, `RosterEntry`, `PlayerSeasonStats`, `Match`, `MatchEvent`, `Transfer`, `Advertisement`, `AuditLog`.
- Enums: `UserRole`, `EntityStatus`, `EditionStatus`, `CompetitionFormat`, `CompetitionStatus`, `MatchStage`, `MatchStatus`, `MatchEventType`, `DocumentType`, `TransferStatus`, `AdPlacement`.
- Índices únicos: `User.email`, `TeamRegistration(teamId,competitionId)`, `Player(documentType,documentNumber)`, `RosterEntry(playerId,teamRegistrationId)`, `PlayerSeasonStats.rosterEntryId`.
- Relación: `User.teamId` UNIQUE → un líder ↔ un equipo.

## league_system_knockout_blocks_mvp (2026-08-16)

Estructura real del torneo, llaves, bloqueo de equipos y MVP.

### Enums nuevos
- `CompetitionKind`: `LEAGUE_DIVISION` | `CUP` | `YOUTH` | `SPECIAL`.
- `RegistrationOutcome`: `NONE` | `PROMOTED` | `RELEGATED` | `WITHDRAWN`.
- `TeamBlockScope`: `CLUB` | `COMPETITION`.

### Tablas nuevas
- `LeagueSystem` — agrupa las divisiones (Primera/Segunda/Tercera) de una edición.
  La Copa apunta a él con `Competition.sourceLeagueSystemId` para saber de dónde
  salen sus equipos.
- `KnockoutTie` — una llave del cuadro. Agrupa 1 partido (único) o 2 (ida y
  vuelta) y apunta a `nextTieId` para que el ganador avance solo.
- `TeamBlock` — historial de bloqueos. **No se borra al levantar el bloqueo**:
  queda el motivo, quién lo aplicó y quién lo levantó.

### Cambios en tablas existentes
- `Category`: `defaultKind`, `defaultDivisionLevel`.
- `Competition`: `kind`, `imageUrl`, `divisionLevel`, `leagueSystemId`,
  `sourceLeagueSystemId`, `rounds`, `twoLeggedStages`, `promotionSpots`,
  `relegationSpots`.
- `TeamRegistration`: `outcome`, `outcomeNote` — ascenso/descenso/baja, decisión
  del administrador y no de la posición en la tabla.
- `Match`: `tieId`, `leg`, `mvpPlayerId`, `mvpPhotoUrl`, `mvpNote`.
- `Match.scheduledAt` pasa a **nullable**: el sorteo genera los cruces sin día ni
  hora y el admin los programa después.

### Cuidado al desplegar
`ALTER TABLE "Match" ALTER COLUMN "scheduledAt" DROP NOT NULL` es compatible
hacia adelante, pero **no es reversible** si ya hay partidos sin fecha: antes de
volver atrás hay que asignarles una o borrarlos.
