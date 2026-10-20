import { registerSelectedCompetitions } from './batchRegistrations';
import { canManageRoster } from './teamRegistrations';
import type { TeamRegistrationWithRoster } from '@/api/teams.api';

export const playerTournamentBlockedReason = (registration: TeamRegistrationWithRoster, playerId?: string) => {
  if (!canManageRoster(registration)) return 'Plantilla cerrada';
  if (playerId && registration.roster.some((entry) => entry.playerId === playerId)) return 'Ya pertenece a esta plantilla';
  if (registration.roster.filter((entry) => entry.status === 'ACTIVE').length >= registration.competition.maxPlayers) return 'Sin cupo disponible';
  return null;
};

/** Create one identity, then reuse it for every roster and for partial retries. */
export async function registerPlayerInTournaments(
  registrationIds: string[],
  playerId: string | undefined,
  create: (registrationId: string) => Promise<{ playerId: string }>,
  add: (registrationId: string, playerId: string) => Promise<unknown>,
) {
  let identity = playerId;
  const result = await registerSelectedCompetitions(registrationIds, async (registrationId) => {
    if (identity) await add(registrationId, identity);
    else identity = (await create(registrationId)).playerId;
  });
  return { ...result, playerId: identity };
}
