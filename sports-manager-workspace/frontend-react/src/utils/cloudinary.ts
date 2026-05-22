import { apiClient } from '../api/client';

export async function uploadToCloudinary(file: File, folder = 'general'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post<{ url: string }>('/upload', formData, {
    params: { folder },
    headers: { 'Content-Type': undefined }, // let browser set multipart/form-data with boundary
  });

  return data.url;
}
