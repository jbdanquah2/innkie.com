import type { PlatformUsageEvent, WorkspaceDailySummary } from '@innkie/shared-models';
import { apiJson } from '../api';
import { env } from '../env';

const base = `${env.apiUrl}/metrics`;

export const metricsApi = {
  summary: (workspaceId: string, days = 30) => apiJson<WorkspaceDailySummary[]>(`${base}/summary?workspaceId=${workspaceId}&days=${days}`).catch(() => [] as WorkspaceDailySummary[]),
  recent: (workspaceId: string, limit = 10) => apiJson<PlatformUsageEvent[]>(`${base}/recent?workspaceId=${workspaceId}&limit=${limit}`).catch(() => [] as PlatformUsageEvent[]),
};
