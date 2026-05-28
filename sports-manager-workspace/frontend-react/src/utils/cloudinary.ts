import { apiClient } from '../api/client';

export async function uploadToCloudinary(file: File, folder = 'general'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post<{ url: string }>('/upload', formData, {
    params: { folder },
    headers: { 'Content-Type': undefined },
  });

  return data.url;
}

export async function uploadWithBgRemoval(file: File, folder = 'general'): Promise<{ url: string; bgRemovedUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post<{ url: string; bgRemovedUrl: string }>('/upload', formData, {
    params: { folder, removeBg: 'true' },
    headers: { 'Content-Type': undefined },
  });

  return data;
}
