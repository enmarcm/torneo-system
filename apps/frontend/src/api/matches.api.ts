import { api } from './axios';

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

export interface Match {
  id: string;
  competitionId: string;
  groupId: string | null;
  stage: 'LEAGUE' | 'GROUP' | 'R16' | 'QUARTER' | 'SEMI' | 'THIRD' | 'FINAL';
  matchday: number;
  homeRegistrationId: string;
  awayRegistrationId: string;
  scheduledAt: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';
  homeScore: number;
  awayScore: number;
  venue: string | null;
  homeRegistration: MatchTeamRegistration;
  awayRegistration: MatchTeamRegistration;
  events?: MatchEvent[];
}

export const matchesApi = {
  list: async (competitionId?: string, status?: string): Promise<Match[]> =>
    (await api.get('/matches', { params: { competitionId, status } })).data.data,
  get: async (id: string): Promise<Match> => (await api.get(`/matches/${id}`)).data.data,
  create: async (data: Partial<Match>): Promise<Match> => (await api.post('/matches', data)).data.data,
  update: async (id: string, data: Partial<Match>): Promise<Match> =>
    (await api.patch(`/matches/${id}`, data)).data.data,
  start: async (id: string): Promise<Match> => (await api.patch(`/matches/${id}/start`)).data.data,
  finish: async (id: string): Promise<Match> => (await api.patch(`/matches/${id}/finish`)).data.data,
  remove: async (id: string) => (await api.delete(`/matches/${id}`)).data.data,
};

export const matchEventsApi = {
  create: async (
    matchId: string,
    data: { type: MatchEvent['type']; minute: number; teamRegistrationId: string; playerId?: string },
  ): Promise<MatchEvent> => (await api.post(`/matches/${matchId}/events`, data)).data.data,
  remove: async (id: string) => (await api.delete(`/events/${id}`)).data.data,
};
