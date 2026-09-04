import { api } from './axios';
import type { Edition } from './editions.api';
import type { Competition } from './competitions.api';
import type { Team } from './teams.api';
import type { Player } from './players.api';
import type { Match } from './matches.api';
import type { StandingRow } from './standings.api';
import type { Ad } from './ads.api';
import type { BracketRound } from './knockout.api';
import type { PlayerStatRow } from './stats.api';
import type { Article } from './news.api';

export type { Edition, Competition, Team, Player, Match, StandingRow, Ad, BracketRound, PlayerStatRow, Article };

/** Inscripción de un equipo en una competición, tal como se publica. */
export interface PublicRegistration {
  id: string;
  teamId: string;
  competitionId: string;
  groupId: string | null;
  team: { id: string; name: string; logoUrl: string | null; status: string };
  group: { id: string; name: string } | null;
}

/** Acotaciones de la lista de partidos: cuántos, en qué orden y si solo los que vienen. */
export interface MatchListOpts {
  limit?: number;
  order?: 'asc' | 'desc';
  upcoming?: boolean;
  /** Solo los partidos marcados como destacados por el administrador. */
  featured?: boolean;
  /** `today` acota a la jornada de hoy, en hora de Venezuela. */
  day?: 'today';
}

/** Acotaciones del listado de noticias. */
export interface NewsListParams {
  kind?: string;
  editionId?: string;
  competitionId?: string;
  teamId?: string;
  year?: number;
  limit?: number;
}

/**
 * Ficha pública de un jugador: en qué equipos y torneos jugó, con qué números.
 * El documento vuelve enmascarado a propósito, para que la ficha no sirva para
 * cosechar cédulas si alguien comparte el enlace.
 */
export interface PublicPlayerProfile {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    documentMasked: string;
  };
  totals: { matchesPlayed: number; goals: number; yellowCards: number; redCards: number };
  teams: Array<{ id: string; name: string; logoUrl: string | null }>;
  career: Array<{
    rosterEntryId: string;
    jerseyNumber: number | null;
    status: string;
    team: { id: string; name: string; logoUrl: string | null };
    competition: {
      id: string;
      name: string;
      kind: Competition['kind'] | null;
      format: Competition['format'] | null;
      division: string | null;
      divisionLevel: number | null;
      category: { id: string; name: string } | null;
    };
    edition: { id: string; name: string; year: number } | null;
    stats: { matchesPlayed: number; goals: number; yellowCards: number; redCards: number };
  }>;
}

export const publicApi = {
  editions: async (): Promise<Edition[]> => (await api.get('/public/editions')).data.data,
  competitions: async (editionId?: string): Promise<Competition[]> =>
    (await api.get('/public/competitions', { params: { editionId } })).data.data,
  teams: async (): Promise<Team[]> => (await api.get('/public/teams')).data.data,
  players: async (search?: string): Promise<Player[]> =>
    (await api.get('/public/players', { params: { search } })).data.data,
  matches: async (
    competitionId?: string,
    status?: string,
    editionId?: string,
    opts?: MatchListOpts,
  ): Promise<Match[]> =>
    (await api.get('/public/matches', {
      params: { competitionId, status, editionId, ...opts },
    })).data.data,
  registrations: async (editionId?: string, competitionId?: string): Promise<PublicRegistration[]> =>
    (await api.get('/public/registrations', { params: { editionId, competitionId } })).data.data,
  standings: async (competitionId: string, groupId?: string): Promise<StandingRow[]> =>
    (await api.get('/public/standings', { params: { competitionId, groupId } })).data.data,
  stats: async (competitionId?: string, editionId?: string): Promise<PlayerStatRow[]> =>
    (await api.get('/public/stats', { params: { competitionId, editionId } })).data.data,
  ads: async (placement?: string): Promise<Ad[]> =>
    (await api.get('/public/ads', { params: { placement } })).data.data,
  groups: async (competitionId: string) =>
    (await api.get(`/public/competitions/${competitionId}/groups`)).data.data,
  bracket: async (competitionId: string): Promise<BracketRound[]> =>
    (await api.get(`/public/competitions/${competitionId}/bracket`)).data.data,
  match: async (id: string): Promise<Match> => (await api.get(`/public/matches/${id}`)).data.data,
  /** Busca la ficha de un jugador por su documento completo. */
  playerByDocument: async (number: string): Promise<PublicPlayerProfile> =>
    (await api.get('/public/players/by-document', { params: { number } })).data.data,
  /** Noticias y fichas técnicas ya publicadas. */
  news: async (params?: NewsListParams): Promise<Article[]> =>
    (await api.get('/public/news', { params })).data.data,
  newsBySlug: async (slug: string): Promise<Article> =>
    (await api.get(`/public/news/${slug}`)).data.data,
};
