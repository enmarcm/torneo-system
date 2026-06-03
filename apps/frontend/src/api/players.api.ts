import { api } from './axios';

export interface Player {
  id: string;
  documentType: 'CEDULA' | 'PARTIDA';
  documentNumber: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  position: string | null;
  photoUrl: string | null;
  universityDegreeVerified: boolean;
  degreeDocUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export const playersApi = {
  list: async (search?: string): Promise<Player[]> =>
    (await api.get('/players', { params: { search } })).data.data,
  byDocument: async (type: 'CEDULA' | 'PARTIDA', number: string): Promise<Player | null> =>
    (await api.get('/players/by-document', { params: { type, number } })).data.data,
  get: async (id: string): Promise<Player> => (await api.get(`/players/${id}`)).data.data,
  create: async (data: Partial<Player>): Promise<Player> =>
    (await api.post('/players', data)).data.data,
  update: async (id: string, data: Partial<Player>): Promise<Player> =>
    (await api.patch(`/players/${id}`, data)).data.data,
  setStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<Player> =>
    (await api.patch(`/players/${id}/status`, { status })).data.data,
  setDegree: async (id: string, data: { universityDegreeVerified: boolean; degreeDocUrl?: string }): Promise<Player> =>
    (await api.patch(`/players/${id}/degree`, data)).data.data,
  competitions: async (id: string) => (await api.get(`/players/${id}/competitions`)).data.data,
};
