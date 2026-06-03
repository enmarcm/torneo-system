import { api } from './axios';

export interface Transfer {
  id: string;
  playerId: string;
  editionId: string;
  fromRegistrationId: string | null;
  toRegistrationId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  player: { id: string; firstName: string; lastName: string; documentNumber: string };
  fromRegistration?: { team: { name: string } } | null;
  toRegistration: { team: { name: string } };
  createdAt: string;
}

export const transfersApi = {
  list: async (editionId?: string): Promise<Transfer[]> =>
    (await api.get('/transfers', { params: { editionId } })).data.data,
  create: async (data: {
    playerId: string;
    editionId: string;
    fromRegistrationId?: string;
    toRegistrationId: string;
  }): Promise<Transfer> => (await api.post('/transfers', data)).data.data,
  setStatus: async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<Transfer> =>
    (await api.patch(`/transfers/${id}/status`, { status })).data.data,
};
