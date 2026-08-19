import { api } from './axios';

/** Ranuras del sitio público donde puede aparecer un anuncio. */
export type AdPlacement =
  | 'HOME_BANNER'
  | 'HOME_INLINE'
  | 'SIDEBAR'
  | 'FOOTER'
  | 'FOOTER_LOGOS'
  | 'MATCH_LIST'
  | 'MATCH_DETAIL'
  | 'STANDINGS'
  | 'LIVE'
  | 'STATS'
  | 'TEAMS';

export interface Ad {
  id: string;
  /** Nombre interno: es lo que el administrador lee en el panel. */
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  /** Un mismo anuncio puede ocupar varias ranuras a la vez. */
  placements: AdPlacement[];
  sortOrder: number;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
}

export const adsApi = {
  /** Solo lo publicable hoy: lo que el visitante ve en esa ranura. */
  list: async (placement?: string): Promise<Ad[]> =>
    (await api.get('/ads', { params: { placement } })).data.data,
  /** Todo, incluido lo apagado, lo programado y lo vencido. Requiere sesión de admin. */
  listAll: async (): Promise<Ad[]> => (await api.get('/ads/manage')).data.data,
  create: async (data: Partial<Ad>): Promise<Ad> => (await api.post('/ads', data)).data.data,
  update: async (id: string, data: Partial<Ad>): Promise<Ad> =>
    (await api.patch(`/ads/${id}`, data)).data.data,
  remove: async (id: string) => (await api.delete(`/ads/${id}`)).data.data,
};
