import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30_000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
      const newToken: string | undefined = res.data?.data?.accessToken;
      if (newToken) {
        useAuthStore.getState().setAccessToken(newToken);
        return newToken;
      }
      return null;
    } catch {
      useAuthStore.getState().logout();
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
};

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return api.request(original);
      }
    }
    return Promise.reject(err);
  },
);

export const extractErrorMessage = (err: unknown, fallback = 'Algo salió mal'): string => {
  const e = err as AxiosError<{ message?: string; code?: string }>;
  return e?.response?.data?.message || e?.message || fallback;
};
