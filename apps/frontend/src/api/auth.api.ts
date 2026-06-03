import { api } from './axios';
import type { AuthUser } from '@/store/useAuthStore';

export const authApi = {
  login: async (email: string, password: string): Promise<{ user: AuthUser; accessToken: string }> => {
    const res = await api.post('/auth/login', { email, password });
    return res.data.data;
  },
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
  me: async (): Promise<AuthUser> => {
    const res = await api.get('/auth/me');
    return res.data.data;
  },
};
