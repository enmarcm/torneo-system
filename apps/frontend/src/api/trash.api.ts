import { api } from './axios';

export type TrashKind =
  | 'EDITION'
  | 'COMPETITION'
  | 'TEAM'
  | 'PLAYER'
  | 'USER'
  | 'MATCH'
  | 'MATCH_EVENT'
  | 'AD'
  | 'ARTICLE'
  | 'LEGAL_PAGE';

export interface TrashItem {
  id: string;
  kind: TrashKind;
  entityId: string;
  label: string;
  detail: string | null;
  /** Filas por tabla que se fueron con el elemento: { match: 12, rosterEntry: 40 }. */
  summary: Record<string, number>;
  deletedById: string | null;
  deletedByName: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface TrashPage {
  items: TrashItem[];
  total: number;
  /** Cuántos hay de cada tipo, sin importar el filtro activo. */
  counts: Partial<Record<TrashKind, number>>;
}

export const trashApi = {
  list: async (params: { kind?: TrashKind; search?: string }): Promise<TrashPage> => {
    const res = (await api.get('/trash', { params: { limit: 100, ...params } })).data;
    return { items: res.data, total: res.meta.total, counts: res.meta.counts ?? {} };
  },
  restore: async (id: string) => (await api.post(`/trash/${id}/restore`)).data.data,
  purge: async (id: string) => (await api.delete(`/trash/${id}`)).data.data,
  empty: async (kind?: TrashKind) => (await api.delete('/trash', { params: { kind } })).data.data,
};
