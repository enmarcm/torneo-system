import { api } from './axios';

export interface RosterEntry {
  id: string;
  playerId: string;
  teamRegistrationId: string;
  jerseyNumber: number | null;
  eligibilityApproved: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  player: {
    id: string;
    firstName: string;
    lastName: string;
    documentNumber: string;
    photoUrl: string | null;
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

export const rostersApi = {
  list: async (registrationId: string): Promise<RosterEntry[]> =>
    (await api.get(`/registrations/${registrationId}/roster`)).data.data,
  add: async (registrationId: string, data: { playerId: string; jerseyNumber?: number }): Promise<RosterEntry> =>
    (await api.post(`/registrations/${registrationId}/roster`, data)).data.data,
  update: async (id: string, data: { jerseyNumber?: number; status?: 'ACTIVE' | 'INACTIVE' }): Promise<RosterEntry> =>
    (await api.patch(`/roster/${id}`, data)).data.data,
  setEligibility: async (id: string, eligibilityApproved: boolean): Promise<RosterEntry> =>
    (await api.patch(`/roster/${id}/eligibility`, { eligibilityApproved })).data.data,
  remove: async (id: string) => (await api.delete(`/roster/${id}`)).data.data,
};
