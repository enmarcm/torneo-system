import { api } from './axios';

/** Qué es una publicación: una nota escrita a mano o una ficha técnica. */
export type ArticleKind = 'NEWS' | 'EDITION_SHEET' | 'COMPETITION_SHEET' | 'TEAM_SHEET';
export type ArticleStatus = 'DRAFT' | 'PUBLISHED';

/** Los tipos de publicación que llevan ficha, en el orden en que se ofrecen. */
export const SHEET_KINDS = ['EDITION_SHEET', 'COMPETITION_SHEET', 'TEAM_SHEET'] as const;
export type SheetKind = (typeof SHEET_KINDS)[number];

export const isSheet = (kind: ArticleKind): kind is SheetKind => kind !== 'NEWS';

export const ARTICLE_KIND_LABEL: Record<ArticleKind, string> = {
  NEWS: 'Noticia',
  EDITION_SHEET: 'Ficha de edición',
  COMPETITION_SHEET: 'Ficha de torneo',
  TEAM_SHEET: 'Ficha de equipo',
};

/*
  La ficha llega como un objeto plano y auto-descriptivo: titulares, tablas y una
  serie para el gráfico. Se pinta con un solo componente, y la que quedó guardada
  en una nota publicada se sigue pudiendo dibujar aunque el cálculo cambie.
*/
export interface SheetFact {
  label: string;
  value: string;
}
export interface SheetHighlight {
  label: string;
  value: string | number;
  hint?: string;
}
export interface SheetTable {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  note?: string;
}
export interface SheetChart {
  title: string;
  labels: string[];
  values: number[];
  unit?: string;
}
export interface FactSheet {
  kind: SheetKind;
  generatedAt: string;
  subject: { id: string; name: string; subtitle?: string; imageUrl?: string | null };
  facts: SheetFact[];
  highlights: SheetHighlight[];
  tables: SheetTable[];
  chart?: SheetChart;
}

export interface Article {
  id: string;
  kind: ArticleKind;
  status: ArticleStatus;
  title: string;
  /** Lo que va en la URL pública. No cambia aunque se edite el titular. */
  slug: string;
  summary: string | null;
  body: string;
  coverUrl: string | null;
  featured: boolean;
  publishedAt: string | null;
  editionId: string | null;
  competitionId: string | null;
  teamId: string | null;
  year: number | null;
  snapshot: FactSheet | null;
  snapshotAt: string | null;
  createdAt: string;
  updatedAt: string;
  edition?: { id: string; name: string; year: number } | null;
  competition?: { id: string; name: string; imageUrl: string | null } | null;
  team?: { id: string; name: string; logoUrl: string | null } | null;
  author?: { id: string; username: string } | null;
}

export interface ArticlePayload {
  kind?: ArticleKind;
  status?: ArticleStatus;
  title?: string;
  summary?: string | null;
  body?: string;
  coverUrl?: string | null;
  featured?: boolean;
  editionId?: string | null;
  competitionId?: string | null;
  teamId?: string | null;
  year?: number | null;
}

export const newsApi = {
  /** Todo, incluidos los borradores. Requiere sesión de staff. */
  listAll: async (): Promise<Article[]> => (await api.get('/news/manage')).data.data,
  get: async (id: string): Promise<Article> => (await api.get(`/news/${id}`)).data.data,
  /** Ficha calculada al vuelo, para verla antes de crear la publicación. */
  preview: async (kind: SheetKind, entityId: string, year?: number | null): Promise<FactSheet> =>
    (await api.get('/news/preview', { params: { kind, entityId, year } })).data.data,
  create: async (data: ArticlePayload): Promise<Article> => (await api.post('/news', data)).data.data,
  update: async (id: string, data: ArticlePayload): Promise<Article> =>
    (await api.patch(`/news/${id}`, data)).data.data,
  /** Recalcula la ficha con los números de hoy. */
  regenerate: async (id: string): Promise<Article> =>
    (await api.post(`/news/${id}/snapshot`)).data.data,
  remove: async (id: string) => (await api.delete(`/news/${id}`)).data.data,
};
