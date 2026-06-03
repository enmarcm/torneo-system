import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { editionsApi, type Edition } from '@/api/editions.api';
import { categoriesApi, type Category } from '@/api/categories.api';
import { competitionsApi, type Competition } from '@/api/competitions.api';
import { teamsApi, type Team, type TeamRegistrationWithRoster, type TeamStats, type TeamRosterEntry } from '@/api/teams.api';
import { playersApi, type Player } from '@/api/players.api';
import { rostersApi, type RosterEntry } from '@/api/rosters.api';
import { matchesApi, type Match } from '@/api/matches.api';
import { standingsApi, type StandingRow } from '@/api/standings.api';
import { statsApi } from '@/api/stats.api';
import { transfersApi, type Transfer } from '@/api/transfers.api';
import { adsApi, type Ad } from '@/api/ads.api';
import { dashboardApi, type DashboardMetrics } from '@/api/dashboard.api';
import { publicApi } from '@/api/public.api';

const REF_STALE = 5 * 60 * 1000;
const MID_STALE = 2 * 60 * 1000;
const FRESH_STALE = 15 * 1000;

export const useEditionsQuery = (options?: UseQueryOptions<Edition[]>) =>
  useQuery({ queryKey: ['editions'], queryFn: editionsApi.list, staleTime: REF_STALE, ...options });

export const useEditionQuery = (id: string) =>
  useQuery({ queryKey: ['editions', id], queryFn: () => editionsApi.get(id), enabled: !!id, staleTime: REF_STALE });

export const useCategoriesQuery = (options?: UseQueryOptions<Category[]>) =>
  useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list, staleTime: REF_STALE, ...options });

export const useCompetitionsQuery = (editionId?: string) =>
  useQuery({ queryKey: ['competitions', editionId], queryFn: () => competitionsApi.list(editionId), staleTime: REF_STALE });

export const useCompetitionQuery = (id: string) =>
  useQuery({ queryKey: ['competitions', id], queryFn: () => competitionsApi.get(id), enabled: !!id, staleTime: REF_STALE });

export const useTeamsQuery = (options?: UseQueryOptions<Team[]>) =>
  useQuery({ queryKey: ['teams'], queryFn: teamsApi.list, staleTime: MID_STALE, ...options });

export const useTeamQuery = (id: string) =>
  useQuery({ queryKey: ['teams', id], queryFn: () => teamsApi.get(id), enabled: !!id, staleTime: MID_STALE });

export const useTeamRegistrationsQuery = (teamId?: string) =>
  useQuery({
    queryKey: ['teams', teamId, 'registrations'],
    queryFn: () => teamsApi.getRegistrations(teamId!),
    enabled: !!teamId,
    staleTime: MID_STALE,
  });

export const useTeamHistoryQuery = (teamId?: string) =>
  useQuery({
    queryKey: ['teams', teamId, 'history'],
    queryFn: () => teamsApi.getHistory(teamId!),
    enabled: !!teamId,
    staleTime: MID_STALE,
  });

export const useTeamStatsQuery = (teamId?: string) =>
  useQuery({
    queryKey: ['teams', teamId, 'stats'],
    queryFn: () => teamsApi.getStats(teamId!),
    enabled: !!teamId,
    staleTime: MID_STALE,
  });

export const useTeamPlayersQuery = (teamId?: string) =>
  useQuery({
    queryKey: ['teams', teamId, 'players'],
    queryFn: () => teamsApi.getPlayers(teamId!),
    enabled: !!teamId,
    staleTime: MID_STALE,
  });

export const usePlayersQuery = (search?: string) =>
  useQuery({ queryKey: ['players', search], queryFn: () => playersApi.list(search), staleTime: MID_STALE });

export const usePlayerQuery = (id: string) =>
  useQuery({ queryKey: ['players', id], queryFn: () => playersApi.get(id), enabled: !!id, staleTime: MID_STALE });

export const useRosterQuery = (registrationId: string) =>
  useQuery({
    queryKey: ['roster', registrationId],
    queryFn: () => rostersApi.list(registrationId),
    enabled: !!registrationId,
    staleTime: MID_STALE,
  });

export const useMatchesQuery = (competitionId?: string, status?: string) =>
  useQuery({
    queryKey: ['matches', competitionId, status],
    queryFn: () => matchesApi.list(competitionId, status),
    staleTime: status === 'LIVE' ? FRESH_STALE : MID_STALE,
  });

export const useMatchQuery = (id: string) =>
  useQuery({ queryKey: ['matches', id], queryFn: () => matchesApi.get(id), enabled: !!id, staleTime: FRESH_STALE });

export const useStandingsQuery = (competitionId: string, groupId?: string) =>
  useQuery({
    queryKey: ['standings', competitionId, groupId],
    queryFn: () => standingsApi.byCompetition(competitionId, groupId),
    enabled: !!competitionId,
    staleTime: MID_STALE,
  });

export const usePlayerStatsQuery = (params?: { competitionId?: string; teamId?: string }) =>
  useQuery({ queryKey: ['stats', 'players', params], queryFn: () => statsApi.players(params), staleTime: MID_STALE });

export const useTransfersQuery = (editionId?: string) =>
  useQuery({ queryKey: ['transfers', editionId], queryFn: () => transfersApi.list(editionId), staleTime: MID_STALE });

export const useAdsQuery = (placement?: string) =>
  useQuery({ queryKey: ['ads', placement], queryFn: () => adsApi.list(placement), staleTime: REF_STALE });

export const useDashboardMetricsQuery = (editionId: string) =>
  useQuery({
    queryKey: ['dashboard', editionId],
    queryFn: () => dashboardApi.metrics(editionId),
    enabled: !!editionId,
    staleTime: FRESH_STALE,
  });

// Public
export const usePublicEditionsQuery = () =>
  useQuery({ queryKey: ['public', 'editions'], queryFn: publicApi.editions, staleTime: REF_STALE });
export const usePublicCompetitionsQuery = (editionId?: string) =>
  useQuery({ queryKey: ['public', 'competitions', editionId], queryFn: () => publicApi.competitions(editionId), staleTime: REF_STALE });
export const usePublicTeamsQuery = () =>
  useQuery({ queryKey: ['public', 'teams'], queryFn: publicApi.teams, staleTime: MID_STALE });
export const usePublicPlayersQuery = (search?: string) =>
  useQuery({ queryKey: ['public', 'players', search], queryFn: () => publicApi.players(search), staleTime: MID_STALE });
export const usePublicMatchesQuery = (competitionId?: string, status?: string) =>
  useQuery({
    queryKey: ['public', 'matches', competitionId, status],
    queryFn: () => publicApi.matches(competitionId, status),
    staleTime: status === 'LIVE' ? FRESH_STALE : MID_STALE,
  });
export const usePublicStandingsQuery = (competitionId: string, groupId?: string) =>
  useQuery({
    queryKey: ['public', 'standings', competitionId, groupId],
    queryFn: () => publicApi.standings(competitionId, groupId),
    enabled: !!competitionId,
    staleTime: MID_STALE,
  });
export const usePublicStatsQuery = (competitionId?: string) =>
  useQuery({ queryKey: ['public', 'stats', competitionId], queryFn: () => publicApi.stats(competitionId), staleTime: MID_STALE });
export const usePublicAdsQuery = (placement?: string) =>
  useQuery({ queryKey: ['public', 'ads', placement], queryFn: () => publicApi.ads(placement), staleTime: REF_STALE });

// Re-export common types used in pages
export type { Edition, Category, Competition, Team, Player, RosterEntry, Match, StandingRow, Transfer, Ad, DashboardMetrics, TeamRegistrationWithRoster, TeamStats, TeamRosterEntry };
