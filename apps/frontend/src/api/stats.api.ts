import { api } from './axios';
import type { CompetitionSummary } from './competitions.api';

/** Una línea del acumulado de un jugador dentro de una competición. */
export interface PlayerStatRow {
  id: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
  rosterEntry?: {
    id: string;
    player?: {
      id: string;
      firstName: string;
      lastName: string;
      photoUrl: string | null;
      position: string | null;
    } | null;
    teamRegistration?: {
      id: string;
      competitionId: string;
      team?: { id: string; name: string; logoUrl: string | null } | null;
      competition?: CompetitionSummary | null;
    } | null;
  } | null;
}

export const statsApi = {
  players: async (params?: {
    competitionId?: string;
    editionId?: string;
    teamId?: string;
    playerId?: string;
  }): Promise<PlayerStatRow[]> => (await api.get('/stats/players', { params })).data.data,
};
