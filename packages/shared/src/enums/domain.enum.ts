export const UserRole = {
  ADMIN: 'ADMIN',
  TEAM_LEADER: 'TEAM_LEADER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const EntityStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;
export type EntityStatus = (typeof EntityStatus)[keyof typeof EntityStatus];

export const EditionStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  FINISHED: 'FINISHED',
} as const;
export type EditionStatus = (typeof EditionStatus)[keyof typeof EditionStatus];

export const CompetitionFormat = {
  LEAGUE: 'LEAGUE',
  GROUPS_KNOCKOUT: 'GROUPS_KNOCKOUT',
} as const;
export type CompetitionFormat = (typeof CompetitionFormat)[keyof typeof CompetitionFormat];

export const CompetitionStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  FINISHED: 'FINISHED',
} as const;
export type CompetitionStatus = (typeof CompetitionStatus)[keyof typeof CompetitionStatus];

export const MatchStage = {
  LEAGUE: 'LEAGUE',
  GROUP: 'GROUP',
  R16: 'R16',
  QUARTER: 'QUARTER',
  SEMI: 'SEMI',
  THIRD: 'THIRD',
  FINAL: 'FINAL',
} as const;
export type MatchStage = (typeof MatchStage)[keyof typeof MatchStage];

export const MatchStatus = {
  SCHEDULED: 'SCHEDULED',
  LIVE: 'LIVE',
  FINISHED: 'FINISHED',
  POSTPONED: 'POSTPONED',
} as const;
export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];

export const MatchEventType = {
  GOAL: 'GOAL',
  YELLOW: 'YELLOW',
  RED: 'RED',
  SUB: 'SUB',
  OTHER: 'OTHER',
} as const;
export type MatchEventType = (typeof MatchEventType)[keyof typeof MatchEventType];

export const DocumentType = {
  CEDULA: 'CEDULA',
  PARTIDA: 'PARTIDA',
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const TransferStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type TransferStatus = (typeof TransferStatus)[keyof typeof TransferStatus];

export const AdPlacement = {
  HOME_BANNER: 'HOME_BANNER',
  SIDEBAR: 'SIDEBAR',
  FOOTER: 'FOOTER',
} as const;
export type AdPlacement = (typeof AdPlacement)[keyof typeof AdPlacement];

export const TZ = 'America/Caracas';
