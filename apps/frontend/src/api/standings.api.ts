import { api } from './axios';

export interface StandingRow {
  position: number;
  registrationId: string;
  teamName: string;
  logoUrl: string | null;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
  /** Zona calculada: ascenso, clasificación a eliminatoria o descenso. */
  zone: 'PROMOTION' | 'QUALIFY' | 'RELEGATION' | 'NORMAL';
  /** Decisión explícita del admin, manda por encima de la zona calculada. */
  outcome: 'NONE' | 'PROMOTED' | 'RELEGATED' | 'WITHDRAWN';
}

export const standingsApi = {
  byCompetition: async (competitionId: string, groupId?: string): Promise<StandingRow[]> =>
    (await api.get('/standings', { params: { competitionId, groupId } })).data.data,
};
