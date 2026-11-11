import { apiJson } from '../api';
import { env } from '../env';

const base = `${env.apiUrl}/analytics`;

export const analyticsApi = {
  clicks: (shortCode: string, days = 7) => apiJson<any>(`${base}/${shortCode}/clicks?days=${days}`),
  visitors: (shortCode: string) => apiJson<any[]>(`${base}/${shortCode}/visitors`),
  workspaceClicks: (workspaceId: string, days = 30) => apiJson<any[]>(`${base}/workspace/${workspaceId}?days=${days}`),
  workspaceStats: (workspaceId: string, days = 7) => apiJson<any>(`${base}/workspace/${workspaceId}/stats?days=${days}`),
};
