import { api } from './axios';

export const uploadsApi = {
  image: async (file: File): Promise<{ key: string; bucket: string; url: string }> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post('/uploads/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};
