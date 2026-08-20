import { api } from './axios';
import type { Match } from './matches.api';
import type { Competition } from './competitions.api';

export interface Team {
  id: string;
  name: string;
  logoUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  leader?: { email: string; status: string } | null;
  _count?: { registrations: number };
}

export interface TeamRegistrationWithRoster {
  id: string;
  teamId: string;
  competitionId: string;
  groupId: string | null;
  status: string;
  /*
    El backend hace `include` de la competición entera, así que estos campos ya
    viajaban; el tipo los recortaba y por eso los selectores del panel de equipo
    no podían decir de qué división era cada torneo.
  */
  competition: {
    id: string;
    name: string;
    kind: Competition['kind'] | null;
    format: Competition['format'] | null;
    division: string | null;
    divisionLevel: number | null;
    category: { id: string; name: string } | null;
  };
  roster: Array<{
    id: string;
    playerId: string;
    jerseyNumber: number | null;
    status: string;
    eligibilityApproved: boolean;
    player: {
      id: string;
      firstName: string;
      lastName: string;
      documentNumber: string;
      photoUrl: string | null;
      position: string | null;
    };
    stats: {
      matchesPlayed: number;
      goals: number;
      assists: number;
      yellowCards: number;
      redCards: number;
      minutesPlayed: number;
    } | null;
  }>;
}

export interface TeamStats {
  totalPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  winRate: number;
}

export interface TeamRosterEntry {
  id: string;
  playerId: string;
  jerseyNumber: number | null;
  status: string;
  eligibilityApproved: boolean;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    documentNumber: string;
    photoUrl: string | null;
    position: string | null;
    birthDate?: string;
  };
  teamRegistration: {
    id: string;
    competition: { id: string; name: string };
  };
  stats: {
    matchesPlayed: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
  } | null;
}

export const teamsApi = {
  list: async (): Promise<Team[]> => (await api.get('/teams')).data.data,
  get: async (id: string): Promise<Team> => (await api.get(`/teams/${id}`)).data.data,
  create: async (data: Partial<Team> & { leaderEmail: string; leaderPassword: string }): Promise<Team> =>
    (await api.post('/teams', data)).data.data,
  update: async (id: string, data: Partial<Team>): Promise<Team> =>
    (await api.patch(`/teams/${id}`, data)).data.data,
  setStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<Team> =>
    (await api.patch(`/teams/${id}/status`, { status })).data.data,
  register: async (id: string, competitionId: string) =>
    (await api.post(`/teams/${id}/registrations`, { competitionId })).data.data,
  getRegistrations: async (id: string): Promise<TeamRegistrationWithRoster[]> =>
    (await api.get(`/teams/${id}/registrations`)).data.data,
  getHistory: async (id: string): Promise<Match[]> => (await api.get(`/teams/${id}/history`)).data.data,
  getStats: async (id: string): Promise<TeamStats> => (await api.get(`/teams/${id}/stats`)).data.data,
  getPlayers: async (id: string): Promise<TeamRosterEntry[]> => (await api.get(`/teams/${id}/players`)).data.data,
  /** Borrado definitivo en cascada: se lleva inscripciones, partidos y el usuario líder. */
  remove: async (id: string): Promise<{ id: string }> =>
    (await api.delete(`/teams/${id}`)).data.data,
};
