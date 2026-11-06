import { api } from './axios';

/** Datos de la liga que se editan desde el panel y se muestran en el pie. */
export interface SiteSettings {
  siteName: string;
  legalName: string;
  taxId: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  schedule: string;
  whatsapp: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  /** Logo principal para fondo claro. Vacío = el logo que trae el sitio. */
  logoUrl: string;
  /** Versión para fondo oscuro y portada. Vacío = se usa `logoUrl`, o el logo por defecto. */
  logoDarkUrl: string;
}

export interface LegalLink {
  slug: string;
  title: string;
}

/** Lo que el sitio público necesita para dibujar el pie. */
export interface PublicSite {
  settings: SiteSettings;
  legalPages: LegalLink[];
}

export interface PublicLegalPage extends LegalLink {
  body: string;
  updatedAt: string;
}

export interface LegalPage extends LegalLink {
  id: string;
  body: string;
  published: boolean;
  showInFooter: boolean;
  sortOrder: number;
  updatedAt: string;
}

export type LegalPagePayload = Partial<Omit<LegalPage, 'id' | 'updatedAt'>>;

/**
 * Lo que se muestra mientras llegan los datos reales, o si el API no responde.
 * El pie nunca debe quedar vacío ni saltar al cargar.
 */
export const FALLBACK_SETTINGS: SiteSettings = {
  siteName: 'Liga Lago Futsal',
  legalName: '',
  taxId: '',
  tagline: 'Resultados, posiciones y calendario de la liga, al minuto y en un solo lugar.',
  address: '',
  phone: '',
  email: '',
  schedule: '',
  whatsapp: '',
  instagramUrl: '',
  facebookUrl: '',
  tiktokUrl: '',
  logoUrl: '',
  logoDarkUrl: '',
};

export const siteApi = {
  public: async (): Promise<PublicSite> => (await api.get('/public/site')).data.data,
  legalPage: async (slug: string): Promise<PublicLegalPage> =>
    (await api.get(`/public/legal/${slug}`)).data.data,

  getSettings: async (): Promise<SiteSettings> => (await api.get('/settings')).data.data,
  updateSettings: async (data: Partial<SiteSettings>): Promise<SiteSettings> =>
    (await api.put('/settings', data)).data.data,

  listLegal: async (): Promise<LegalPage[]> => (await api.get('/settings/legal')).data.data,
  createLegal: async (data: LegalPagePayload): Promise<LegalPage> =>
    (await api.post('/settings/legal', data)).data.data,
  updateLegal: async (id: string, data: LegalPagePayload): Promise<LegalPage> =>
    (await api.patch(`/settings/legal/${id}`, data)).data.data,
  removeLegal: async (id: string) => (await api.delete(`/settings/legal/${id}`)).data.data,
};
