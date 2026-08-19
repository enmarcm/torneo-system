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

export type { Edition, Competition, Team, Player, Match, StandingRow, Ad, BracketRound, PlayerStatRow };

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
};
