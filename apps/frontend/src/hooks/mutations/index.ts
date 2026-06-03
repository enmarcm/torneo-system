import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editionsApi, type Edition } from '@/api/editions.api';
import { categoriesApi, type Category } from '@/api/categories.api';
import { competitionsApi, type Competition } from '@/api/competitions.api';
import { teamsApi, type Team } from '@/api/teams.api';
import { playersApi, type Player } from '@/api/players.api';
import { rostersApi, type RosterEntry } from '@/api/rosters.api';
import { matchesApi, matchEventsApi, type Match } from '@/api/matches.api';
import { transfersApi, type Transfer } from '@/api/transfers.api';
import { adsApi, type Ad } from '@/api/ads.api';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/useAuthStore';

const invalidate = (qc: ReturnType<typeof useQueryClient>, keys: string[][]) => {
  keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
};

export const useLoginMutation = () => {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authApi.login(email, password),
    onSuccess: (data) => setSession(data.user, data.accessToken),
  });
};

export const useCreateEdition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: editionsApi.create,
    onSuccess: () => invalidate(qc, [['editions'], ['public', 'editions']]),
  });
};
export const useUpdateEdition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Edition> }) => editionsApi.update(id, data),
    onSuccess: () => invalidate(qc, [['editions'], ['public', 'editions']]),
  });
};
export const useSetEditionStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Edition['status'] }) => editionsApi.setStatus(id, status),
    onSuccess: () => invalidate(qc, [['editions'], ['public', 'editions']]),
  });
};
export const useSetTransfers = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { transfersOpen: boolean; transferWindowStart?: string; transferWindowEnd?: string };
    }) => editionsApi.setTransfers(id, data),
    onSuccess: () => invalidate(qc, [['editions'], ['public', 'editions']]),
  });
};

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => invalidate(qc, [['categories']]),
  });
};
export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => categoriesApi.update(id, data),
    onSuccess: () => invalidate(qc, [['categories']]),
  });
};
export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.remove,
    onSuccess: () => invalidate(qc, [['categories']]),
  });
};

export const useCreateCompetition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: competitionsApi.create,
    onSuccess: () => invalidate(qc, [['competitions'], ['public', 'competitions']]),
  });
};
export const useUpdateCompetition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Competition> }) => competitionsApi.update(id, data),
    onSuccess: () => invalidate(qc, [['competitions'], ['public', 'competitions']]),
  });
};
export const useSetCompetitionStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Competition['status'] }) => competitionsApi.setStatus(id, status),
    onSuccess: () => invalidate(qc, [['competitions'], ['public', 'competitions']]),
  });
};

export const useCreateTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teamsApi.create,
    onSuccess: () => invalidate(qc, [['teams'], ['public', 'teams']]),
  });
};
export const useUpdateTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Team> }) => teamsApi.update(id, data),
    onSuccess: (_d, vars) => invalidate(qc, [['teams'], ['teams', vars.id], ['public', 'teams']]),
  });
};
export const useSetTeamStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => teamsApi.setStatus(id, status),
    onSuccess: () => invalidate(qc, [['teams'], ['public', 'teams']]),
  });
};
export const useRegisterTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, competitionId }: { id: string; competitionId: string }) => teamsApi.register(id, competitionId),
    onSuccess: () => invalidate(qc, [['teams'], ['competitions'], ['public', 'teams'], ['public', 'competitions']]),
  });
};

export const useCreatePlayer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: playersApi.create,
    onSuccess: () => invalidate(qc, [['players'], ['public', 'players']]),
  });
};
export const useUpdatePlayer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Player> }) => playersApi.update(id, data),
    onSuccess: () => invalidate(qc, [['players'], ['public', 'players']]),
  });
};
export const useSetPlayerStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => playersApi.setStatus(id, status),
    onSuccess: () => invalidate(qc, [['players'], ['public', 'players']]),
  });
};
export const useSetPlayerDegree = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { universityDegreeVerified: boolean; degreeDocUrl?: string } }) =>
      playersApi.setDegree(id, data),
    onSuccess: () => invalidate(qc, [['players'], ['public', 'players']]),
  });
};

export const useAddRoster = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ registrationId, data }: { registrationId: string; data: { playerId: string; jerseyNumber?: number } }) =>
      rostersApi.add(registrationId, data),
    onSuccess: (_d, vars) => invalidate(qc, [['roster', vars.registrationId], ['teams']]),
  });
};
export const useUpdateRoster = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { jerseyNumber?: number; status?: 'ACTIVE' | 'INACTIVE' } }) =>
      rostersApi.update(id, data),
    onSuccess: () => invalidate(qc, [['roster'], ['teams']]),
  });
};
export const useSetEligibility = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) => rostersApi.setEligibility(id, approved),
    onSuccess: () => invalidate(qc, [['roster']]),
  });
};
export const useRemoveRoster = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rostersApi.remove,
    onSuccess: () => invalidate(qc, [['roster'], ['teams']]),
  });
};

export const useCreateMatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: matchesApi.create,
    onSuccess: () => invalidate(qc, [['matches'], ['public', 'matches'], ['dashboard']]),
  });
};
export const useUpdateMatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Match> }) => matchesApi.update(id, data),
    onSuccess: () => invalidate(qc, [['matches'], ['public', 'matches'], ['dashboard']]),
  });
};
export const useStartMatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: matchesApi.start,
    onSuccess: () => invalidate(qc, [['matches'], ['public', 'matches'], ['dashboard']]),
  });
};
export const useFinishMatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: matchesApi.finish,
    onSuccess: () => invalidate(qc, [['matches'], ['public', 'matches'], ['dashboard'], ['standings'], ['public', 'standings'], ['stats']]),
  });
};
export const useDeleteMatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: matchesApi.remove,
    onSuccess: () => invalidate(qc, [['matches'], ['public', 'matches'], ['dashboard']]),
  });
};
export const useCreateMatchEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      matchId,
      data,
    }: {
      matchId: string;
      data: { type: 'GOAL' | 'YELLOW' | 'RED' | 'SUB' | 'OTHER'; minute: number; teamRegistrationId: string; playerId?: string };
    }) => matchEventsApi.create(matchId, data),
    onSuccess: () => invalidate(qc, [['matches'], ['public', 'matches'], ['standings'], ['stats']]),
  });
};

export const useCreateTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: transfersApi.create,
    onSuccess: () => invalidate(qc, [['transfers'], ['roster'], ['teams']]),
  });
};
export const useSetTransferStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) => transfersApi.setStatus(id, status),
    onSuccess: () => invalidate(qc, [['transfers'], ['roster'], ['teams']]),
  });
};

export const useCreateAd = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adsApi.create,
    onSuccess: () => invalidate(qc, [['ads'], ['public', 'ads']]),
  });
};
export const useUpdateAd = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Ad> }) => adsApi.update(id, data),
    onSuccess: () => invalidate(qc, [['ads'], ['public', 'ads']]),
  });
};
export const useDeleteAd = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adsApi.remove,
    onSuccess: () => invalidate(qc, [['ads'], ['public', 'ads']]),
  });
};
