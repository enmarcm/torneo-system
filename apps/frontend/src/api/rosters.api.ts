import { api } from './axios';

export interface RosterEntry {
  id: string;
  playerId: string;
  teamRegistrationId: string;
  jerseyNumber: number | null;
  eligibilityApproved: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  player: {
    id: string;
    firstName: string;
    lastName: string;
    documentNumber: string;
    photoUrl: string | null;
  };
  stats: {
    matchesPlayed: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
  } | null;
}

/** Plantilla del torneo anterior de este equipo, para traerla de un tirón. */
export interface PreviousRoster {
  source: {
    registrationId: string;
    competitionName: string;
    editionName: string | null;
    editionYear: number | null;
  };
  players: Array<{
    playerId: string;
    firstName: string;
    lastName: string;
    documentNumber: string;
    photoUrl: string | null;
    jerseyNumber: number | null;
    alreadyInRoster: boolean;
    /** No cumple el rango de edad de la competición de destino. */
    outOfAge: boolean;
  }>;
  /** Cuántos entrarían realmente si se importa ahora. */
  importable: number;
}

export interface ImportPreviousResult {
  source: PreviousRoster['source'];
  added: string[];
  skipped: Array<{ name: string; reason: string }>;
}

export const rostersApi = {
  previous: async (registrationId: string): Promise<PreviousRoster | null> =>
    (await api.get(`/registrations/${registrationId}/roster/previous`)).data.data,
  importPrevious: async (registrationId: string): Promise<ImportPreviousResult> =>
    (await api.post(`/registrations/${registrationId}/roster/import-previous`)).data.data,
  list: async (registrationId: string): Promise<RosterEntry[]> =>
    (await api.get(`/registrations/${registrationId}/roster`)).data.data,
  add: async (registrationId: string, data: { playerId: string; jerseyNumber?: number }): Promise<RosterEntry> =>
    (await api.post(`/registrations/${registrationId}/roster`, data)).data.data,
  update: async (id: string, data: { jerseyNumber?: number; status?: 'ACTIVE' | 'INACTIVE' }): Promise<RosterEntry> =>
    (await api.patch(`/roster/${id}`, data)).data.data,
  setEligibility: async (id: string, eligibilityApproved: boolean): Promise<RosterEntry> =>
    (await api.patch(`/roster/${id}/eligibility`, { eligibilityApproved })).data.data,
  remove: async (id: string) => (await api.delete(`/roster/${id}`)).data.data,
};
