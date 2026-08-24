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
  /**
   * Zona calculada: clasificación a eliminatoria o descenso, y solo cuando la
   * competición las tiene configuradas. El ascenso no es una zona de la tabla:
   * lo decide el administrador sobre la inscripción (`outcome`).
   */
  zone: 'QUALIFY' | 'RELEGATION' | 'NORMAL';
  /** Decisión explícita del admin, manda por encima de la zona calculada. */
  outcome: 'NONE' | 'PROMOTED' | 'RELEGATED' | 'WITHDRAWN';
}

export const standingsApi = {
  byCompetition: async (competitionId: string, groupId?: string): Promise<StandingRow[]> =>
    (await api.get('/standings', { params: { competitionId, groupId } })).data.data,
};
