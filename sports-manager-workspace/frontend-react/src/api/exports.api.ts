import { apiClient } from './client';

async function downloadExport(url: string, filename: string): Promise<void> {
  const res = await apiClient.get<Blob>(url, { responseType: 'blob' });
  const href = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

export const exportsApi = {
  standings: (id: string, fmt: 'csv' | 'xlsx') =>
    downloadExport(`/tournaments/${id}/export/standings?format=${fmt}`, `posiciones.${fmt}`),

  scorers: (id: string, fmt: 'csv' | 'xlsx') =>
    downloadExport(`/tournaments/${id}/export/scorers?format=${fmt}`, `goleadores.${fmt}`),

  fines: (id: string, fmt: 'csv' | 'xlsx') =>
    downloadExport(`/tournaments/${id}/export/fines?format=${fmt}`, `multas.${fmt}`),

  payments: (id: string, fmt: 'csv' | 'xlsx') =>
    downloadExport(`/tournaments/${id}/export/payments?format=${fmt}`, `pagos.${fmt}`),
};
