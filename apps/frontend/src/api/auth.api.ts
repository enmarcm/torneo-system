import { api } from './axios';
import type { AuthUser } from '@/store/useAuthStore';

export const authApi = {
  login: async (username: string, password: string): Promise<{ user: AuthUser; accessToken: string }> => {
    const res = await api.post('/auth/login', { username, password });
    return res.data.data;
  },
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
  me: async (): Promise<AuthUser> => {
    const res = await api.get('/auth/me');
    return res.data.data;
  },
  /** El propio usuario carga o cambia su correo de contacto. */
  updateMe: async (data: { email: string | null }): Promise<AuthUser> => {
    const res = await api.patch('/auth/me', data);
    return res.data.data;
  },
};
