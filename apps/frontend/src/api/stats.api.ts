import { api } from './axios';

export const statsApi = {
  players: async (params?: { competitionId?: string; teamId?: string; playerId?: string }) =>
    (await api.get('/stats/players', { params })).data.data,
};
