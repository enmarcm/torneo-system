# Migraciones Prisma — Backend

## init (2026-06-03)
- Crea todas las tablas base: `User`, `Edition`, `Category`, `Competition`, `CompetitionGroup`, `Team`, `TeamRegistration`, `Player`, `RosterEntry`, `PlayerSeasonStats`, `Match`, `MatchEvent`, `Transfer`, `Advertisement`, `AuditLog`.
- Enums: `UserRole`, `EntityStatus`, `EditionStatus`, `CompetitionFormat`, `CompetitionStatus`, `MatchStage`, `MatchStatus`, `MatchEventType`, `DocumentType`, `TransferStatus`, `AdPlacement`.
- Índices únicos: `User.email`, `TeamRegistration(teamId,competitionId)`, `Player(documentType,documentNumber)`, `RosterEntry(playerId,teamRegistrationId)`, `PlayerSeasonStats.rosterEntryId`.
- Relación: `User.teamId` UNIQUE → un líder ↔ un equipo.
