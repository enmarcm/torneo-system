import { api } from './axios';

export interface DashboardMetrics {
  competitions: number;
  teams: number;
  players: number;
  matchesPlayed: number;
  matchesLive: number;
  matchesScheduled: number;
}

export const dashboardApi = {
  metrics: async (editionId: string): Promise<DashboardMetrics> =>
    (await api.get('/dashboard', { params: { editionId } })).data.data,
};
