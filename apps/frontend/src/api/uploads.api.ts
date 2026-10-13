import { api } from './axios';

export const uploadsApi = {
  identity: async (file: File): Promise<{ key: string }> => {
    const data = new FormData(); data.append('file', file);
    return (await api.post('/uploads/identity', data, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
  },
  identityUrl: async (key: string): Promise<string> => {
    const response = await api.get(`/uploads/identity/${encodeURIComponent(key)}/image`, { responseType: 'blob' });
    return URL.createObjectURL(response.data);
  },
  image: async (file: File): Promise<{ key: string; bucket: string; url: string }> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post('/uploads/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};
