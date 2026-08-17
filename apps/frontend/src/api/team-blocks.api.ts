import { api } from './axios';

export interface TeamBlock {
  id: string;
  teamId: string;
  /** CLUB bloquea el club entero (incluido el login); COMPETITION solo un torneo. */
  scope: 'CLUB' | 'COMPETITION';
  competitionId: string | null;
  reason: string;
  active: boolean;
  liftedAt: string | null;
  liftReason: string | null;
  createdAt: string;
  team: { id: string; name: string; logoUrl: string | null; status: 'ACTIVE' | 'INACTIVE' };
  competition: { id: string; name: string } | null;
  blockedBy: { id: string; email: string } | null;
  liftedBy: { id: string; email: string } | null;
}

export interface TeamBlockSummary {
  club: TeamBlock | null;
  competitions: TeamBlock[];
}

export const teamBlocksApi = {
  list: async (filters?: {
    teamId?: string;
    competitionId?: string;
    active?: boolean;
  }): Promise<TeamBlock[]> => (await api.get('/team-blocks', { params: filters })).data.data,
  forTeam: async (teamId: string): Promise<TeamBlockSummary> =>
    (await api.get(`/team-blocks/team/${teamId}`)).data.data,
  create: async (data: {
    teamId: string;
    scope: 'CLUB' | 'COMPETITION';
    competitionId?: string;
    reason: string;
  }): Promise<TeamBlock> => (await api.post('/team-blocks', data)).data.data,
  lift: async (id: string, liftReason?: string): Promise<TeamBlock> =>
    (await api.patch(`/team-blocks/${id}/lift`, { liftReason })).data.data,
};
