import { api } from './axios';
import type { Edition } from './editions.api';
import type { Competition } from './competitions.api';
import type { Team } from './teams.api';
import type { Player } from './players.api';
import type { Match } from './matches.api';
import type { StandingRow } from './standings.api';
import type { Ad } from './ads.api';

export type { Edition, Competition, Team, Player, Match, StandingRow, Ad };

export const publicApi = {
  editions: async (): Promise<Edition[]> => (await api.get('/public/editions')).data.data,
  competitions: async (editionId?: string): Promise<Competition[]> =>
    (await api.get('/public/competitions', { params: { editionId } })).data.data,
  teams: async (): Promise<Team[]> => (await api.get('/public/teams')).data.data,
  players: async (search?: string): Promise<Player[]> =>
    (await api.get('/public/players', { params: { search } })).data.data,
  matches: async (competitionId?: string, status?: string): Promise<Match[]> =>
    (await api.get('/public/matches', { params: { competitionId, status } })).data.data,
  standings: async (competitionId: string, groupId?: string): Promise<StandingRow[]> =>
    (await api.get('/public/standings', { params: { competitionId, groupId } })).data.data,
  stats: async (competitionId?: string) =>
    (await api.get('/public/stats', { params: { competitionId } })).data.data,
  ads: async (placement?: string): Promise<Ad[]> =>
    (await api.get('/public/ads', { params: { placement } })).data.data,
};
