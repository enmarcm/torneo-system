import { sortCompetitions } from './competitionMeta';
import type { TeamRegistrationWithRoster } from '@/api/teams.api';
export const canManageRoster = (registration: TeamRegistrationWithRoster) =>
  registration.status === 'ACTIVE' && registration.outcome !== 'WITHDRAWN' && registration.competition.status !== 'FINISHED';


export const getVisibleTeamRegistrations = (registrations: TeamRegistrationWithRoster[], includeHistory = false) =>
  includeHistory ? registrations : registrations.filter(canManageRoster);

export const getTeamCompetitions = (registrations: TeamRegistrationWithRoster[], editionId?: string) =>
  sortCompetitions(registrations
    .filter((registration) => !editionId || registration.competition.editionId === editionId)
    .map((registration) => registration.competition));
