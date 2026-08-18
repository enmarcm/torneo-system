import { api } from './axios';
import type { CompetitionSummary } from './competitions.api';

export interface MatchTeamRegistration {
  id: string;
  team: { id: string; name: string; logoUrl: string | null };
}

export interface MatchEvent {
  id: string;
  type: 'GOAL' | 'YELLOW' | 'RED' | 'SUB' | 'OTHER';
  minute: number;
  playerId: string | null;
  teamRegistrationId: string;
  player?: { id: string; firstName: string; lastName: string } | null;
}

export interface MatchMvpPlayer {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
}

export interface Match {
  id: string;
  competitionId: string;
  groupId: string | null;
  stage: 'LEAGUE' | 'GROUP' | 'R16' | 'QUARTER' | 'SEMI' | 'THIRD' | 'FINAL';
  matchday: number;
  tieId: string | null;
  /** 1 = ida, 2 = vuelta. Null en partido único o de liga. */
  leg: number | null;
  homeRegistrationId: string;
  awayRegistrationId: string;
  /** Null mientras el partido está sorteado pero sin día ni hora asignados. */
  scheduledAt: string | null;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';
  homeScore: number;
  awayScore: number;
  venue: string | null;
  mvpPlayerId: string | null;
  mvpPhotoUrl: string | null;
  mvpNote: string | null;
  mvpPlayer?: MatchMvpPlayer | null;
  homeRegistration: MatchTeamRegistration;
  awayRegistration: MatchTeamRegistration;
  /** Competición de la que sale el partido, para etiquetarlo en listas mixtas. */
  competition?: CompetitionSummary | null;
  events?: MatchEvent[];
}

export const matchesApi = {
  list: async (competitionId?: string, status?: string, editionId?: string): Promise<Match[]> =>
    (await api.get('/matches', { params: { competitionId, status, editionId } })).data.data,
  get: async (id: string): Promise<Match> => (await api.get(`/matches/${id}`)).data.data,
  create: async (data: Partial<Match>): Promise<Match> => (await api.post('/matches', data)).data.data,
  update: async (id: string, data: Partial<Match>): Promise<Match> =>
    (await api.patch(`/matches/${id}`, data)).data.data,
  start: async (id: string): Promise<Match> => (await api.patch(`/matches/${id}/start`)).data.data,
  finish: async (id: string): Promise<Match> => (await api.patch(`/matches/${id}/finish`)).data.data,
  /** Asigna día, hora y sede a un partido que salió del sorteo sin fecha. */
  schedule: async (
    id: string,
    data: { scheduledAt: string | null; venue?: string | null },
  ): Promise<Match> => (await api.patch(`/matches/${id}/schedule`, data)).data.data,
  setMvp: async (
    id: string,
    data: { playerId: string; photoUrl?: string | null; note?: string | null },
  ): Promise<Match> => (await api.patch(`/matches/${id}/mvp`, data)).data.data,
  clearMvp: async (id: string): Promise<Match> => (await api.delete(`/matches/${id}/mvp`)).data.data,
  remove: async (id: string) => (await api.delete(`/matches/${id}`)).data.data,
};

export const matchEventsApi = {
  create: async (
    matchId: string,
    data: { type: MatchEvent['type']; minute: number; teamRegistrationId: string; playerId?: string },
  ): Promise<MatchEvent> => (await api.post(`/matches/${matchId}/events`, data)).data.data,
  remove: async (id: string) => (await api.delete(`/events/${id}`)).data.data,
};
