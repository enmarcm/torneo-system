import { api } from './axios';

export interface Competition {
  id: string;
  editionId: string;
  categoryId: string;
  name: string;
  format: 'LEAGUE' | 'GROUPS_KNOCKOUT';
  /** Tipo de torneo: división de liga, copa, menores o especial (Gremial/Veterano). */
  kind: 'LEAGUE_DIVISION' | 'CUP' | 'YOUTH' | 'SPECIAL';
  imageUrl: string | null;
  division: string | null;
  /** 1 = Primera, 2 = Segunda, 3 = Tercera. */
  divisionLevel: number | null;
  leagueSystemId: string | null;
  sourceLeagueSystemId: string | null;
  rounds: number;
  /** Rondas de eliminatoria que se juegan a ida y vuelta. */
  twoLeggedStages: Array<'R16' | 'QUARTER' | 'SEMI' | 'THIRD' | 'FINAL'>;
  promotionSpots: number;
  relegationSpots: number;
  ageMin: number | null;
  ageMax: number | null;
  requiresAdminEligibility: boolean;
  minPlayers: number;
  maxPlayers: number;
  manualTeamSelection: boolean;
  knockoutQualifiers: number | null;
  numGroups: number | null;
  groupSize: number | null;
  qualifiersPerGroup: number | null;
  status: 'DRAFT' | 'ACTIVE' | 'FINISHED';
  category?: { id: string; name: string };
  _count?: { registrations: number; matches: number };
}

/**
 * Datos mínimos de la competición que viajan dentro de otros recursos
 * (partidos, estadísticas) para poder etiquetarlos sin pedirla aparte.
 */
export interface CompetitionSummary {
  id: string;
  name: string;
  kind: Competition['kind'];
  format: Competition['format'];
  division: string | null;
  divisionLevel: number | null;
  editionId: string;
  category?: { id: string; name: string } | null;
}

export const competitionsApi = {
  list: async (editionId?: string): Promise<Competition[]> =>
    (await api.get('/competitions', { params: { editionId } })).data.data,
  get: async (id: string): Promise<Competition> => (await api.get(`/competitions/${id}`)).data.data,
  create: async (data: Partial<Competition>): Promise<Competition> =>
    (await api.post('/competitions', data)).data.data,
  update: async (id: string, data: Partial<Competition>): Promise<Competition> =>
    (await api.patch(`/competitions/${id}`, data)).data.data,
  setStatus: async (id: string, status: Competition['status']): Promise<Competition> =>
    (await api.patch(`/competitions/${id}/status`, { status })).data.data,
  /** Ascenso / descenso / no participa: lo decide el admin, no la tabla. */
  setRegistrationOutcome: async (
    registrationId: string,
    outcome: 'NONE' | 'PROMOTED' | 'RELEGATED' | 'WITHDRAWN',
    outcomeNote?: string,
  ) =>
    (await api.patch(`/competitions/registrations/${registrationId}/outcome`, {
      outcome,
      outcomeNote,
    })).data.data,
  /** Borrado definitivo en cascada: se lleva inscripciones, partidos y estadísticas. */
  remove: async (id: string): Promise<{ id: string }> =>
    (await api.delete(`/competitions/${id}`)).data.data,
};

export const fixturesApi = {
  /** Sortea el todos contra todos. Genera solo los cruces, sin día ni hora. */
  /** `kept`: partidos con fecha que el sorteo respetó en lugar de rehacer. */
  drawLeague: async (
    competitionId: string,
  ): Promise<{ matchdays: number; matches: number; kept: number }> =>
    (await api.post(`/competitions/${competitionId}/fixture/league`)).data.data,
  /** Sortea los grupos y el todos contra todos dentro de cada uno. */
  drawGroups: async (competitionId: string): Promise<{ groups: number; matches: number }> =>
    (await api.post(`/competitions/${competitionId}/fixture/groups`)).data.data,
  clear: async (competitionId: string, stage: 'LEAGUE' | 'GROUP') =>
    (await api.delete(`/competitions/${competitionId}/fixture`, { data: { stage } })).data.data,
  scheduleBulk: async (items: Array<{ matchId: string; scheduledAt: string; venue?: string }>) =>
    (await api.patch('/fixture/schedule-bulk', { items })).data.data,
};
