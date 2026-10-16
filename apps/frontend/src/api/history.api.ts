import { api } from './axios';
import type { Match } from './matches.api';

export interface HistoryFilters {
  q?: string; year?: number; editionId?: string; competitionId?: string; teamId?: string;
  ageGroup?: 'ADULT' | 'YOUTH'; status?: 'ACTIVE' | 'INACTIVE';
  sort?: 'name' | 'goals' | 'matches' | 'tournaments'; page?: number; limit?: number;
}
export interface HistoricalStats { matchesPlayed: number; goals: number; assists: number; yellowCards: number; redCards: number; minutesPlayed: number }
export interface HistoricalCompetition {
  id: string; name: string; ageGroup: 'ADULT' | 'YOUTH'; status: string; kind: string; editionId: string; maxPlayers: number;
  edition: { id: string; name: string; year: number; status: string };
}
export interface HistoryReportRow {
  id: string; name: string; status: 'ACTIVE' | 'INACTIVE'; photoUrl?: string | null; logoUrl?: string | null;
  documentNumber?: string; teams?: number; players?: number; tournaments: number; matchesPlayed: number;
  goals: number; assists?: number; yellowCards?: number; redCards?: number;
  goalsAgainst?: number; wins?: number; draws?: number; losses?: number;
}
export interface HistoryReport {
  rows: HistoryReportRow[]; total: number; page: number; limit: number;
  summary: { total: number; goals: number; matchesPlayed: number };
}
export interface PlayerHistory {
  player: { id: string; firstName: string; lastName: string; birthDate: string; documentType: string; documentNumber: string; photoUrl: string | null; position: string | null; status: 'ACTIVE' | 'INACTIVE'; createdAt: string; universityDegreeVerified: boolean };
  totals: HistoricalStats; teams: number; tournaments: number;
  career: { id: string; jerseyNumber: number | null; status: string; createdAt: string; stats: HistoricalStats | null;
    teamRegistration: { id: string; status: string; outcome: string; team: { id: string; name: string; logoUrl: string | null }; competition: HistoricalCompetition };
  }[];
  matches: (Match & { events: { id: string; type: string; minute: number; teamRegistrationId: string }[]; attendances: { present: boolean }[] })[];
  totalMatches: number; page: number; limit: number;
  transfers: { id: string; status: string; createdAt: string; edition: { name: string; year: number };
    fromRegistration: { team: { id: string; name: string } } | null;
    toRegistration: { team: { id: string; name: string }; competition: { name: string } };
  }[];
}
export interface TeamHistoryTotals { matchesPlayed: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number }
export interface TeamHistory {
  team: { id: string; name: string; logoUrl: string | null; status: 'ACTIVE' | 'INACTIVE'; createdAt: string; leader: { username: string } | null };
  totals: TeamHistoryTotals; players: number;
  career: { id: string; status: string; outcome: string; competition: HistoricalCompetition; totals: TeamHistoryTotals;
    roster: { id: string; playerId: string; status: string; jerseyNumber: number | null; stats: HistoricalStats | null;
      player: { id: string; firstName: string; lastName: string; photoUrl: string | null; status: string };
    }[];
  }[];
  matches: Match[]; totalMatches: number; page: number; limit: number;
}
export const historyApi = {
  report: async (kind: 'players' | 'teams', filters: HistoryFilters): Promise<HistoryReport> => (await api.get(`/history/${kind}`, { params: filters })).data.data,
  player: async (id: string, filters: HistoryFilters): Promise<PlayerHistory> => (await api.get(`/history/players/${id}`, { params: filters })).data.data,
  team: async (id: string, filters: HistoryFilters): Promise<TeamHistory> => (await api.get(`/history/teams/${id}`, { params: filters })).data.data,
};
