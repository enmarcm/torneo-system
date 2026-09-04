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
import { adsApi, type Ad } from '@/api/ads.api';
import { newsApi, type Article, type SheetKind } from '@/api/news.api';
import { dashboardApi, type DashboardMetrics } from '@/api/dashboard.api';
import { knockoutApi, type BracketRound } from '@/api/knockout.api';
import { teamBlocksApi, type TeamBlock } from '@/api/team-blocks.api';
import { publicApi, type MatchListOpts, type NewsListParams } from '@/api/public.api';
import { usersApi, type ManagedUser } from '@/api/users.api';
import type { UserRole } from '@/utils/roles';

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

/** Plantilla del torneo anterior del equipo, para ofrecer traerla. */
export const usePreviousRosterQuery = (registrationId: string, enabled = true) =>
  useQuery({
    queryKey: ['roster', registrationId, 'previous'],
    queryFn: () => rostersApi.previous(registrationId),
    enabled: enabled && !!registrationId,
    staleTime: MID_STALE,
    retry: false,
  });

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

/*
  Programación de un solo día. Sin competición trae la de todas, que es como el
  panel muestra la jornada completa; el filtro por día lo resuelve el servidor
  para no depender del techo de resultados del listado general.
*/
export const useMatchesByDayQuery = (day: string, competitionId?: string, enabled = true) =>
  useQuery({
    queryKey: ['matches', 'day', day, competitionId],
    queryFn: () => matchesApi.list(competitionId, undefined, undefined, { day, limit: 300 }),
    enabled: enabled && !!day,
    staleTime: FRESH_STALE,
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

/** Panel de administración: todos los anuncios, también los apagados y vencidos. */
export const useAdsQuery = () =>
  useQuery({ queryKey: ['ads', 'manage'], queryFn: adsApi.listAll, staleTime: REF_STALE });

/** Panel de noticias: también los borradores. */
export const useNewsAdminQuery = () =>
  useQuery({ queryKey: ['news', 'manage'], queryFn: newsApi.listAll, staleTime: MID_STALE });

/*
  Ficha calculada al vuelo para el panel. Se pide solo cuando ya hay entidad
  elegida: sin eso el servidor responde 422 y el formulario parpadearía en rojo
  mientras el redactor todavía está eligiendo.
*/
export const useFactSheetPreviewQuery = (
  kind?: SheetKind,
  entityId?: string,
  year?: number | null,
) =>
  useQuery({
    queryKey: ['news', 'preview', kind, entityId, year ?? null],
    queryFn: () => newsApi.preview(kind as SheetKind, entityId as string, year),
    enabled: !!kind && !!entityId,
    staleTime: FRESH_STALE,
    retry: false,
  });

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
export const usePublicMatchesQuery = (
  competitionId?: string,
  status?: string,
  editionId?: string,
  opts?: MatchListOpts,
) =>
  useQuery({
    queryKey: ['public', 'matches', competitionId, status, editionId, opts],
    queryFn: () => publicApi.matches(competitionId, status, editionId, opts),
    staleTime: status === 'LIVE' ? FRESH_STALE : MID_STALE,
    /*
      El socket es el camino rápido; esto es la red debajo. Si la conexión se
      cae —y en la cancha, con datos móviles, se cae— el marcador se refresca
      igual cada 20 segundos en vez de quedarse clavado sin que nadie se entere.
    */
    refetchInterval: status === 'LIVE' ? 20_000 : false,
    refetchOnWindowFocus: status === 'LIVE',
  });
export const usePublicRegistrationsQuery = (editionId?: string, competitionId?: string) =>
  useQuery({
    queryKey: ['public', 'registrations', editionId, competitionId],
    queryFn: () => publicApi.registrations(editionId, competitionId),
    enabled: !!editionId || !!competitionId,
    staleTime: MID_STALE,
  });
/**
 * Detalle de un partido con sus goles y tarjetas. El listado no los incluye, así
 * que sin esta consulta el detalle abre siempre con el historial vacío.
 */
export const usePublicMatchQuery = (id?: string) =>
  useQuery({
    queryKey: ['public', 'match', id],
    queryFn: () => publicApi.match(id as string),
    enabled: !!id,
    staleTime: FRESH_STALE,
  });
export const usePublicStandingsQuery = (competitionId: string, groupId?: string) =>
  useQuery({
    queryKey: ['public', 'standings', competitionId, groupId],
    queryFn: () => publicApi.standings(competitionId, groupId),
    enabled: !!competitionId,
    staleTime: MID_STALE,
  });
export const usePublicStatsQuery = (competitionId?: string, editionId?: string) =>
  useQuery({
    queryKey: ['public', 'stats', competitionId, editionId],
    queryFn: () => publicApi.stats(competitionId, editionId),
    staleTime: MID_STALE,
  });
export const usePublicNewsQuery = (params?: NewsListParams) =>
  useQuery({
    queryKey: ['public', 'news', params ?? {}],
    queryFn: () => publicApi.news(params),
    staleTime: MID_STALE,
  });
export const usePublicNewsBySlugQuery = (slug?: string) =>
  useQuery({
    queryKey: ['public', 'news', 'slug', slug],
    queryFn: () => publicApi.newsBySlug(slug as string),
    enabled: !!slug,
    staleTime: MID_STALE,
  });
export const usePublicAdsQuery = (placement?: string) =>
  useQuery({ queryKey: ['public', 'ads', placement], queryFn: () => publicApi.ads(placement), staleTime: REF_STALE });
export const usePublicGroupsQuery = (competitionId: string) =>
  useQuery({
    queryKey: ['public', 'groups', competitionId],
    queryFn: () => publicApi.groups(competitionId),
    enabled: !!competitionId,
    staleTime: MID_STALE,
  });

// Cuadros de eliminatoria
export const useBracketQuery = (competitionId: string) =>
  useQuery({
    queryKey: ['bracket', competitionId],
    queryFn: () => knockoutApi.bracket(competitionId),
    enabled: !!competitionId,
    staleTime: MID_STALE,
  });

// Bloqueos de equipo
export const useTeamBlocksQuery = (filters?: {
  teamId?: string;
  competitionId?: string;
  active?: boolean;
}) =>
  useQuery({
    queryKey: ['team-blocks', filters],
    queryFn: () => teamBlocksApi.list(filters),
    staleTime: MID_STALE,
  });
export const useTeamBlockSummaryQuery = (teamId: string) =>
  useQuery({
    queryKey: ['team-blocks', 'team', teamId],
    queryFn: () => teamBlocksApi.forTeam(teamId),
    enabled: !!teamId,
    staleTime: MID_STALE,
  });

// Cuentas del sistema (solo administrador general)
export const useUsersQuery = (filters?: { role?: UserRole; q?: string }) =>
  useQuery({ queryKey: ['users', filters ?? {}], queryFn: () => usersApi.list(filters), staleTime: MID_STALE });

// Re-export common types used in pages
export type { Edition, Category, Competition, Team, Player, RosterEntry, Match, StandingRow, Ad, Article, DashboardMetrics, TeamRegistrationWithRoster, TeamStats, TeamRosterEntry, BracketRound, TeamBlock, ManagedUser };
