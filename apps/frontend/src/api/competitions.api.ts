import { api } from './axios';

export interface Competition {
  id: string;
  editionId: string;
  categoryId: string;
  name: string;
  format: 'LEAGUE' | 'GROUPS_KNOCKOUT';
  division: string | null;
  ageMin: number | null;
  ageMax: number | null;
  requiresAdminEligibility: boolean;
  minPlayers: number;
  maxPlayers: number;
  manualTeamSelection: boolean;
  knockoutQualifiers: number | null;
  numGroups: number | null;
  groupSize: number | null;
  qualifiersPerGroup: number | null;
  status: 'DRAFT' | 'ACTIVE' | 'FINISHED';
  category?: { id: string; name: string };
  _count?: { registrations: number; matches: number };
}

export const competitionsApi = {
  list: async (editionId?: string): Promise<Competition[]> =>
    (await api.get('/competitions', { params: { editionId } })).data.data,
  get: async (id: string): Promise<Competition> => (await api.get(`/competitions/${id}`)).data.data,
  create: async (data: Partial<Competition>): Promise<Competition> =>
    (await api.post('/competitions', data)).data.data,
  update: async (id: string, data: Partial<Competition>): Promise<Competition> =>
    (await api.patch(`/competitions/${id}`, data)).data.data,
  setStatus: async (id: string, status: Competition['status']): Promise<Competition> =>
    (await api.patch(`/competitions/${id}/status`, { status })).data.data,
};
