import { api } from './axios';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  defaultFormat: 'LEAGUE' | 'GROUPS_KNOCKOUT';
  defaultAgeMin: number | null;
  defaultAgeMax: number | null;
  defaultRequiresAdminEligibility: boolean;
  defaultMinPlayers: number;
  defaultMaxPlayers: number;
  active: boolean;
}

export const categoriesApi = {
  list: async (): Promise<Category[]> => (await api.get('/categories')).data.data,
  create: async (data: Partial<Category>): Promise<Category> =>
    (await api.post('/categories', data)).data.data,
  update: async (id: string, data: Partial<Category>): Promise<Category> =>
    (await api.patch(`/categories/${id}`, data)).data.data,
  remove: async (id: string): Promise<{ id: string; deleted?: boolean }> =>
    (await api.delete(`/categories/${id}`)).data.data,
};
