import { api } from './axios';

export interface Ad {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  placement: 'HOME_BANNER' | 'SIDEBAR' | 'FOOTER';
  sortOrder: number;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
}

export const adsApi = {
  list: async (placement?: string): Promise<Ad[]> =>
    (await api.get('/ads', { params: { placement } })).data.data,
  create: async (data: Partial<Ad>): Promise<Ad> => (await api.post('/ads', data)).data.data,
  update: async (id: string, data: Partial<Ad>): Promise<Ad> =>
    (await api.patch(`/ads/${id}`, data)).data.data,
  remove: async (id: string) => (await api.delete(`/ads/${id}`)).data.data,
};
