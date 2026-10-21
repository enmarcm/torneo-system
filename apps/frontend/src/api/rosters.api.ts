import { api } from './axios';
import type { Player } from './players.api';

export type CreateRosterPlayerInput = Pick<Player, 'documentType' | 'documentNumber' | 'firstName' | 'lastName' | 'birthDate' | 'photoUrl' | 'identityPhotoKey'> & { jerseyNumber?: number };

export interface RosterCandidate {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  documentType: Player['documentType'];
  documentMasked: string;
  eligible: boolean;
}

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
    /** Legacy compatibility field; age limits no longer apply. */
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
  candidates: async (registrationId: string, search: string): Promise<RosterCandidate[]> =>
    (await api.get(`/registrations/${registrationId}/roster/candidates`, { params: { search } })).data.data,
  createPlayer: async (registrationId: string, data: CreateRosterPlayerInput): Promise<RosterEntry> =>
    (await api.post(`/registrations/${registrationId}/roster/players`, data)).data.data,
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
