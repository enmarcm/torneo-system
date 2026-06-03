import { api } from './axios';

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
  competition: {
    id: string;
    name: string;
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
};
