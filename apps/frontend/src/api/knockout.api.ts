import { api } from './axios';
import type { Match } from './matches.api';

export interface TieSide {
  id: string;
  team: { id: string; name: string; logoUrl: string | null };
}

export interface KnockoutTie {
  id: string;
  competitionId: string;
  stage: 'R16' | 'QUARTER' | 'SEMI' | 'THIRD' | 'FINAL';
  slot: number;
  /** Si la llave se juega a ida y vuelta. */
  twoLegged: boolean;
  homeRegistrationId: string | null;
  awayRegistrationId: string | null;
  winnerRegistrationId: string | null;
  nextTieId: string | null;
  homeRegistration: TieSide | null;
  awayRegistration: TieSide | null;
  winnerRegistration: TieSide | null;
  matches: Match[];
}

export interface BracketRound {
  stage: KnockoutTie['stage'];
  ties: KnockoutTie[];
}

export const knockoutApi = {
  bracket: async (competitionId: string): Promise<BracketRound[]> =>
    (await api.get(`/competitions/${competitionId}/bracket`)).data.data,
  generate: async (competitionId: string): Promise<KnockoutTie[]> =>
    (await api.post(`/competitions/${competitionId}/bracket`)).data.data,
  /** Ubica a los clasificados de cada grupo en la primera ronda. */
  seedFromGroups: async (competitionId: string): Promise<KnockoutTie[]> =>
    (await api.post(`/competitions/${competitionId}/bracket/seed`)).data.data,
  setTeams: async (
    tieId: string,
    homeRegistrationId: string,
    awayRegistrationId: string,
  ): Promise<KnockoutTie> =>
    (await api.patch(`/ties/${tieId}/teams`, { homeRegistrationId, awayRegistrationId })).data.data,
  /** Crea el partido único o los dos de ida y vuelta según la llave. */
  createMatches: async (tieId: string): Promise<Match[]> =>
    (await api.post(`/ties/${tieId}/matches`)).data.data,
  /** Resuelve por marcador global y empuja al ganador a la ronda siguiente. */
  resolve: async (tieId: string): Promise<KnockoutTie> =>
    (await api.post(`/ties/${tieId}/resolve`)).data.data,
  setWinner: async (tieId: string, winnerRegistrationId: string): Promise<KnockoutTie> =>
    (await api.patch(`/ties/${tieId}/winner`, { winnerRegistrationId })).data.data,
};
