import { api } from './axios';

export interface Player {
  id: string;
  documentType: 'CEDULA' | 'PARTIDA';
  documentNumber: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  position: string | null;
  photoUrl: string | null;
  identityPhotoKey: string | null;
  universityDegreeVerified: boolean;
  degreeDocUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  /** Equipo que tiene el pase del jugador en cada apartado (solo viene en el listado). */
  clubs?: Array<{ ageGroup: AgeGroup; team: { id: string; name: string } }>;
}

export type AgeGroup = 'ADULT' | 'YOUTH';

/** Pase vigente: qué equipo tiene a un jugador en un apartado. */
export interface PlayerHold {
  id: string;
  ageGroup: AgeGroup;
  teamId: string;
  team: { id: string; name: string };
  player: { id: string; firstName: string; lastName: string; photoUrl: string | null; status: 'ACTIVE' | 'INACTIVE' };
}

export const playersApi = {
  list: async (search?: string, ageGroup?: 'ADULT' | 'YOUTH'): Promise<Player[]> =>
    (await api.get('/players', { params: { search, ageGroup } })).data.data,
  byDocument: async (type: 'CEDULA' | 'PARTIDA', number: string): Promise<Player | null> =>
    (await api.get('/players/by-document', { params: { type, number } })).data.data,
  get: async (id: string): Promise<Player> => (await api.get(`/players/${id}`)).data.data,
  create: async (data: Partial<Player>): Promise<Player> =>
    (await api.post('/players', data)).data.data,
  update: async (id: string, data: Partial<Player>): Promise<Player> =>
    (await api.patch(`/players/${id}`, data)).data.data,
  setStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<Player> =>
    (await api.patch(`/players/${id}/status`, { status })).data.data,
  setDegree: async (id: string, data: { universityDegreeVerified: boolean; degreeDocUrl?: string }): Promise<Player> =>
    (await api.patch(`/players/${id}/degree`, data)).data.data,
  /** Pases vigentes: el delegado ve los de su equipo; el administrador puede acotar por equipo. */
  holds: async (teamId?: string): Promise<PlayerHold[]> =>
    (await api.get('/players/holds', { params: { teamId } })).data.data,
  /** Libera al jugador en un apartado para que otro equipo pueda inscribirlo. */
  release: async (id: string, ageGroup: AgeGroup) =>
    (await api.post(`/players/${id}/release`, { ageGroup })).data.data,
  competitions: async (id: string) => (await api.get(`/players/${id}/competitions`)).data.data,
  /** Borrado definitivo en cascada: se lleva plantillas, goles y tarjetas. */
  remove: async (id: string): Promise<{ id: string }> =>
    (await api.delete(`/players/${id}`)).data.data,
};
