import { api } from './axios';

export interface Edition {
  id: string;
  name: string;
  year: number;
  seasonNumber: number;
  status: 'DRAFT' | 'ACTIVE' | 'FINISHED';
  transfersOpen: boolean;
  transferWindowStart: string | null;
  transferWindowEnd: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export const editionsApi = {
  list: async (): Promise<Edition[]> => (await api.get('/editions')).data.data,
  get: async (id: string): Promise<Edition> => (await api.get(`/editions/${id}`)).data.data,
  create: async (data: Partial<Edition>): Promise<Edition> => (await api.post('/editions', data)).data.data,
  update: async (id: string, data: Partial<Edition>): Promise<Edition> =>
    (await api.patch(`/editions/${id}`, data)).data.data,
  setStatus: async (id: string, status: Edition['status']): Promise<Edition> =>
    (await api.patch(`/editions/${id}/status`, { status })).data.data,
  setTransfers: async (
    id: string,
    data: { transfersOpen: boolean; transferWindowStart?: string; transferWindowEnd?: string },
  ): Promise<Edition> => (await api.patch(`/editions/${id}/transfers`, data)).data.data,
};
