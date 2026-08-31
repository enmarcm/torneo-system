import { api } from './axios';
import type { UserRole } from '@/utils/roles';

export interface ManagedUser {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  teamId: string | null;
  team: { id: string; name: string; logoUrl: string | null } | null;
  createdAt: string;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  email?: string | null;
  role: UserRole;
  teamId?: string | null;
}

export interface UpdateUserPayload {
  username?: string;
  email?: string | null;
  role?: UserRole;
  teamId?: string | null;
}

export const usersApi = {
  list: async (filters?: { role?: UserRole; q?: string }): Promise<ManagedUser[]> =>
    (await api.get('/users', { params: filters })).data.data,
  create: async (data: CreateUserPayload): Promise<ManagedUser> =>
    (await api.post('/users', data)).data.data,
  update: async (id: string, data: UpdateUserPayload): Promise<ManagedUser> =>
    (await api.patch(`/users/${id}`, data)).data.data,
  /** El administrador le pone una contraseña nueva a cualquier cuenta. */
  setPassword: async (id: string, password: string) =>
    (await api.patch(`/users/${id}/password`, { password })).data.data,
  setStatus: async (id: string, status: ManagedUser['status']): Promise<ManagedUser> =>
    (await api.patch(`/users/${id}/status`, { status })).data.data,
  remove: async (id: string) => (await api.delete(`/users/${id}`)).data.data,
};
